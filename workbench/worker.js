import { processTask } from './operations'

self.onmessage = async ({ data }) => {
    try {
        const result = await processTask(data.type, data.data, (stage) =>
            self.postMessage({ stage }),
        )
        self.postMessage({ result })
    } catch (error) {
        self.postMessage({
            error: error.name === 'OperationError' ? 'wrongPassword' : error.message,
        })
    }
}
