// fetch-polyfill
import fetch,{Blob} from 'node-fetch'
import FormData from 'form-data';
if (!globalThis.fetch) {
    globalThis.fetch = fetch as any
    globalThis.FormData = FormData as any
}
