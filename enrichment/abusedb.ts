export default class AbuseDb {
    constructor(addr: any, env: any) {
        this.addr = addr
        this._data = []
        this._endpoint = 'https://cfwho.com/api/v1'
    }

    async lookup() {
        if (this._data.length > 0) {
            return this._data
        }

        let d = await fetch(`${this._endpoint}/${this.addr.join(',')}`, {
            headers: {
                'Accept': 'application/json'
            },
            cf: {
                cacheEverything: true,
                cacheTtlByStatus: {
                    "200-299": 900,
                    404: 1,
                    "500-599": 0
                }
            }
        })
        try {
            d = await d.json()
            for (let a of Object.keys(d)) {
                if (d[a]['success']) {
                    this._data = this._data.concat(d[a]['contacts']['abuse'].filter(value => !this._data.includes(value)));
                }
            }
        } catch (e) {}

        return this._data
    }
}