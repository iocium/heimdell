export default class Urlscan {
    constructor(url: any, token: any, visibility: any = "unlisted") {
        this.url = url;
        this.token = token;
        this.visibility = visibility;

        this._endpoint = "https://urlscan.io/api/v1";
    }

    async get(id) {
        let u = await fetch(`${this._endpoint}/result/${id}`, {
            cf: {
                cacheEverything: true,
                cacheTtlByStatus: {
                    "200-299": 900,
                    404: 1,
                    "500-599": 0
                }
            }
        })
        u = await u.json()
        return u
    }

    async submit() {
        let u = await fetch(`${this._endpoint}/scan`, {
            method: 'POST',
            body: JSON.stringify({
                'url': this.url,
                'visibility': this.visibility,
                'tags': ['phishing.fyi']
            }),
            headers: {
                'API-Key': this.token,
                'Content-Type': 'application/json'
            }
        })
        u = await u.json()
        return u
    }
}