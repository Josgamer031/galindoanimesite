import asyncio
import re
import json
from typing import Optional
from contextlib import asynccontextmanager

import fastapi
import fastapi.middleware.cors
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser, Page

# Global browser instance
browser: Optional[Browser] = None
playwright_instance = None

BASE_URL = "https://www4.animeflv.net"
IMG_BASE = "https://animeflv.net"


@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    global browser, playwright_instance
    playwright_instance = await async_playwright().start()
    browser = await playwright_instance.chromium.launch(
        headless=True,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
        ]
    )
    yield
    if browser:
        await browser.close()
    if playwright_instance:
        await playwright_instance.stop()


app = fastapi.FastAPI(lifespan=lifespan)

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_page() -> Page:
    """Create a new page with ad blocking"""
    if not browser:
        raise fastapi.HTTPException(status_code=503, detail="Browser not initialized")
    
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1920, "height": 1080},
    )
    
    # Block ads and trackers
    await context.route("**/*", lambda route: (
        route.abort() if any(p in route.request.url.lower() for p in [
            "doubleclick", "googlesyndication", "adservice", "ads.", "advert",
            "tracker", "analytics", "facebook.com/tr", "googletagmanager"
        ]) else route.continue_()
    ))
    
    page = await context.new_page()
    return page


def fix_img(url: str) -> str:
    """Fix image URLs to be absolute"""
    if not url:
        return ""
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return IMG_BASE + url
    return url


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "browser": browser is not None}


@app.get("/latest-episodes")
async def get_latest_episodes():
    """Get latest anime episodes from homepage"""
    page = await get_page()
    try:
        await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("ul li a[href*='/ver/']", timeout=10000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "lxml")
        
        episodes = []
        for a in soup.select("ul li a[href*='/ver/']"):
            href = a.get("href", "")
            chap_match = re.search(r"-(\d+)$", href)
            if not chap_match:
                continue
            
            img = a.select_one("img")
            strong = a.select_one("strong")
            ep_id_match = re.search(r"/ver/(.+)-\d+$", href)
            
            episodes.append({
                "title": strong.get_text(strip=True) if strong else "",
                "chapter": int(chap_match.group(1)),
                "cover": fix_img(img.get("src", "") if img else ""),
                "url": BASE_URL + href if href.startswith("/") else href,
                "animeId": ep_id_match.group(1) if ep_id_match else "",
            })
        
        return {"episodes": episodes}
    finally:
        await page.context.close()


@app.get("/on-air")
async def get_on_air_animes():
    """Get currently airing animes"""
    page = await get_page()
    try:
        await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("article", timeout=10000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "lxml")
        
        animes = []
        for article in soup.select("article"):
            a = article.select_one("a")
            if not a:
                continue
            href = a.get("href", "")
            if "/anime/" not in href:
                continue
            
            anime_id = re.sub(r".*/anime/", "", href)
            img = article.select_one("figure img")
            h3 = article.select_one("h3")
            spans = article.select("div > p > span")
            anime_type = spans[0].get_text(strip=True) if spans else "Anime"
            rating = spans[1].get_text(strip=True) if len(spans) > 1 else ""
            
            pars = article.select("div > p")
            synopsis = pars[2].get_text(strip=True) if len(pars) >= 3 else ""
            
            status_span = article.select_one("span span")
            status = "En emisión" if status_span and "ESTRENO" in status_span.get_text() else ""
            
            animes.append({
                "id": anime_id,
                "title": h3.get_text(strip=True) if h3 else "",
                "cover": fix_img(img.get("src", "") if img else ""),
                "synopsis": synopsis,
                "rating": rating,
                "type": anime_type,
                "url": BASE_URL + href if href.startswith("/") else href,
                "status": status,
            })
        
        return {"animes": animes}
    finally:
        await page.context.close()


@app.get("/search")
async def search_anime(q: str):
    """Search for animes by query"""
    page = await get_page()
    try:
        url = f"{BASE_URL}/browse?q={q}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("article", timeout=10000)
        
        html = await page.content()
        return {"animes": parse_anime_list(html)}
    except Exception:
        return {"animes": []}
    finally:
        await page.context.close()


@app.get("/genre/{genre}")
async def get_animes_by_genre(genre: str, page_num: int = 1):
    """Get animes by genre"""
    page = await get_page()
    try:
        url = f"{BASE_URL}/browse?genre%5B%5D={genre}&order=rating&page={page_num}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("article", timeout=10000)
        
        html = await page.content()
        return {"animes": parse_anime_list(html)}
    except Exception:
        return {"animes": []}
    finally:
        await page.context.close()


@app.get("/directory")
async def get_directory(page_num: int = 1, order: str = "rating"):
    """Get anime directory"""
    page = await get_page()
    try:
        url = f"{BASE_URL}/browse?order={order}&page={page_num}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("article", timeout=10000)
        
        html = await page.content()
        return {"animes": parse_anime_list(html)}
    except Exception:
        return {"animes": []}
    finally:
        await page.context.close()


def parse_anime_list(html: str) -> list:
    """Parse anime list from browse pages"""
    soup = BeautifulSoup(html, "lxml")
    animes = []
    
    for article in soup.select("article"):
        a = article.select_one("a")
        if not a:
            continue
        href = a.get("href", "")
        if "/anime/" not in href:
            continue
        
        anime_id = re.sub(r".*/anime/", "", href)
        img = article.select_one("figure img")
        h3 = article.select_one("h3")
        spans = article.select("div > p > span")
        anime_type = spans[0].get_text(strip=True) if spans else "Anime"
        rating = spans[1].get_text(strip=True) if len(spans) > 1 else ""
        
        pars = article.select("div > p")
        synopsis = pars[2].get_text(strip=True) if len(pars) >= 3 else ""
        
        animes.append({
            "id": anime_id,
            "title": h3.get_text(strip=True) if h3 else "",
            "cover": fix_img(img.get("src", "") if img else ""),
            "synopsis": synopsis,
            "rating": rating,
            "type": anime_type,
            "url": BASE_URL + href if href.startswith("/") else href,
        })
    
    return animes


@app.get("/anime/{anime_id}")
async def get_anime_detail(anime_id: str):
    """Get detailed anime information"""
    page = await get_page()
    try:
        url = f"{BASE_URL}/anime/{anime_id}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "lxml")
        
        title_el = soup.select_one("h1.Title, .Ficha h1, h1")
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            return {"error": "Anime not found"}
        
        synopsis_el = soup.select_one(".Description p, .Synopsis p, .Description")
        synopsis = synopsis_el.get_text(strip=True) if synopsis_el else ""
        
        cover_el = soup.select_one(".AnimeCover img, .Image img, figure img")
        cover = fix_img(cover_el.get("src", "") if cover_el else "")
        
        rating_el = soup.select_one(".Vts, .vtprmd")
        rating = rating_el.get_text(strip=True) if rating_el else "4.5"
        
        status_el = soup.select_one(".AnmStts span, .status")
        status = status_el.get_text(strip=True) if status_el else "En emisión"
        
        type_el = soup.select_one(".Type")
        anime_type = type_el.get_text(strip=True) if type_el else "Anime"
        
        genres = []
        for el in soup.select(".Nvgnrs a, nav a[href*='genre']"):
            text = el.get_text(strip=True)
            if text:
                genres.append(text)
        
        alt_titles = []
        for el in soup.select(".TxtAlt, span.TxtAlt"):
            text = el.get_text(strip=True)
            if text:
                alt_titles.append(text)
        
        # Extract episode list from JavaScript
        episode_list = []
        for script in soup.select("script"):
            content = script.string or ""
            match = re.search(r"var\s+episodes\s*=\s*(\[.*?\]);", content, re.DOTALL)
            if match:
                try:
                    eps = json.loads(match.group(1))
                    for ep in eps:
                        episode_list.append({"episode": ep[0], "id": ep[1]})
                except:
                    pass
        
        # Fallback: extract from links
        if not episode_list:
            for link in soup.select(f"a[href*='/ver/']"):
                href = link.get("href", "")
                match = re.search(r"-(\d+)$", href)
                if match and anime_id in href:
                    ep_num = int(match.group(1))
                    if not any(e["episode"] == ep_num for e in episode_list):
                        episode_list.append({"episode": ep_num, "id": 0})
        
        episode_list.sort(key=lambda x: x["episode"])
        
        return {
            "title": title,
            "alternativeTitles": alt_titles,
            "status": status,
            "rating": rating,
            "type": anime_type,
            "cover": cover,
            "synopsis": synopsis,
            "genres": genres if genres else ["Acción", "Aventura"],
            "episodeList": episode_list,
            "url": url,
            "related": [],
        }
    finally:
        await page.context.close()


@app.get("/episode/{anime_id}/{episode}")
async def get_episode_servers(anime_id: str, episode: int):
    """Get video servers for an episode"""
    page = await get_page()
    try:
        url = f"{BASE_URL}/ver/{anime_id}-{episode}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "lxml")
        
        servers = []
        
        # Extract servers from JavaScript
        for script in soup.select("script"):
            content = script.string or ""
            match = re.search(r"var\s+videos\s*=\s*(\{.*?\});", content, re.DOTALL)
            if match:
                try:
                    videos = json.loads(match.group(1))
                    if "SUB" in videos:
                        for v in videos["SUB"]:
                            server_url = v.get("url", "") or v.get("code", "")
                            # Skip ad URLs
                            if any(p in server_url.lower() for p in ["doubleclick", "googlesyndication", "adservice"]):
                                continue
                            servers.append({
                                "server": v.get("server", ""),
                                "title": v.get("title", v.get("server", "")),
                                "url": v.get("url", ""),
                                "code": v.get("code", ""),
                                "mediaUrl": extract_media_url(v.get("url"), v.get("code")),
                            })
                except:
                    pass
        
        # Fallback: get iframe sources
        if not servers:
            for iframe in soup.select("iframe"):
                src = iframe.get("src") or iframe.get("data-src", "")
                if src and not any(p in src.lower() for p in ["doubleclick", "googlesyndication", "adservice"]):
                    servers.append({
                        "server": "default",
                        "title": "Reproductor",
                        "url": src,
                        "code": src,
                        "mediaUrl": extract_media_url(src, src),
                    })
        
        return {"servers": servers}
    finally:
        await page.context.close()


def extract_media_url(url: Optional[str], code: Optional[str]) -> str:
    """Extract playable media URL from server data"""
    if not url and not code:
        return ""
    
    # Check if URL is directly playable
    media_pattern = r"\.(mp4|webm|ogg|m3u8|mpd)(?:\?.*)?$"
    
    if url and re.search(media_pattern, url, re.IGNORECASE):
        return normalize_url(url)
    
    # Try to find media URL in code
    if code:
        url_pattern = r'["\'`]((?:(?:https?:)?//[^"\'`\s]+|/[^"\'`\s]+|[^"\'`\s]+?/(?:[^"\'`\s]+))\.(?:mp4|webm|ogg|m3u8|mpd)(?:\?[^"\'`\s]*)?)["\'`]'
        match = re.search(url_pattern, code, re.IGNORECASE)
        if match:
            return normalize_url(match.group(1))
    
    return ""


def normalize_url(url: str) -> str:
    """Normalize URL to be absolute"""
    if not url:
        return ""
    if url.startswith("//"):
        return f"https:{url}"
    return url


@app.get("/proxy")
async def proxy_page(url: str):
    """Proxy a page to resolve video sources"""
    page = await get_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        html = await page.content()
        
        # Try to find playable media
        soup = BeautifulSoup(html, "lxml")
        
        # Check video elements
        video = soup.select_one("video")
        if video:
            src = video.get("src") or ""
            source = video.select_one("source")
            if source:
                src = source.get("src", src)
            if src:
                return {"mediaUrl": normalize_url(src)}
        
        # Check source elements
        source = soup.select_one("source")
        if source:
            src = source.get("src", "")
            if src:
                return {"mediaUrl": normalize_url(src)}
        
        # Try to find in scripts
        media_pattern = r'["\'`]((?:(?:https?:)?//[^"\'`\s]+|/[^"\'`\s]+)\.(?:mp4|webm|ogg|m3u8|mpd)(?:\?[^"\'`\s]*)?)["\'`]'
        for script in soup.select("script"):
            content = script.string or ""
            match = re.search(media_pattern, content, re.IGNORECASE)
            if match:
                return {"mediaUrl": normalize_url(match.group(1))}
        
        return {"mediaUrl": "", "html": html[:5000]}
    finally:
        await page.context.close()
