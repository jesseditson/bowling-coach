onmessage = async (e) => {
    switch (e.data.action) {
        case 'file':
            const url = await readFile(e.data.data)
            postMessage({action: 'read-complete', data: url})
            break;
    }
}


function readFile(file) {
    return new Promise(resolve => {
        // Closure to capture the file information.
        const reader = new FileReader()
        reader.onload = (e) => {
            const data = e.target.result
            const url = URL.createObjectURL(data)
            resolve(url)
        }
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                if (percentLoaded < 100) {
                    postMessage({action: 'progress', data: percentLoaded + '%'})
                }
            }
        }
        reader.readAsBinaryString(file)
    })
}