export default {
    async fetch(request, env) {
        if (request.method == 'OPTIONS') {
            let headers = request.headers
            if (
                headers.get("Origin") != null &&
                headers.get("Access-Control-Request-Method") != null &&
                headers.get("Access-Control-Request-Headers") != null
            ) {
                let respHeaders = {
                    // "Access-Control-Allow-Origin": "https://sgi.uaeu.club",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,HEAD,PUT,OPTIONS",
                    "Access-Control-Max-Age": "86400",
                    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
                }
                const origin = headers.get("Origin")
                if (origin != "https://sgi.uaeu.club" && origin != "https://skill-gap-index-web.pages.dev" && origin != "https://dev.skill-gap-index-web.pages.dev") {
                    return new Response('Unauthorized', { status: 401 })
                }
                return new Response(null, {
                    headers: respHeaders,
                })
            }
            else {
                return new Response(null, {
                    headers: {
                        Allow: "GET, HEAD, PUT, OPTIONS",
                    },
                })
            }
        } else if (request.method == 'PUT') {
            const auth = request.headers.get('Authorization');
            const expectedAuth = `Bearer ${env.AUTH_SECRET}`
            const origin = request.headers.get("Origin")
            if (!auth || auth != expectedAuth || (origin != "https://sgi.uaeu.club"
                && origin != "https://skill-gap-index-web.pages.dev" && origin != "https://dev.skill-gap-index-web.pages.dev")) {
                return new Response(`Unauthorized`, { status: 401 })
            } else {
                const fileName = request.headers.get('file-name')
                const fileExtension = request.headers.get('file-ext')
                const fileLastMod = request.headers.get('file-last-mod')
                const uni = request.headers.get('university')

                const text = await request.text();

                const file = JSON.stringify({
                    "filename": fileName,
                    "file-ext": fileExtension,
                    "file-last-mod": fileLastMod,
                    "keywords": await analyze(text, env),
                })
                await env.SGI.put(`${uni}/${Date.now()}_${fileName.replace(/ /g, "_")}.json`, file)
                let respHeaders = {
                    // "Access-Control-Allow-Origin": "https://sgi.uaeu.club",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,HEAD,PUT,OPTIONS",
                    "Access-Control-Max-Age": "86400",
                    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
                }
                return new Response(`File created for ${uni}`, {
                    headers: respHeaders,
                })
            }
        } else if (request.method == 'GET' || request.method == 'HEAD') {
            return new Response("OK");
        } else {
            return new Response("Not Implemented", { status: 501 });
        }
    },
};

const analyze = async (toAnalyze, env) => {
    const file = await env.SGI.get('global/keywords.txt')
    const text = await file.text()
    const kw = text.split("\n").map(element => element.trim())
    let found = {}
    kw.forEach(element => {
        const regex = new RegExp(escapeRegExp(element), "gi")
        const matches = toAnalyze.match(regex)
        if (matches) {
            found[element] = matches.length
        };
    });
    return found;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}