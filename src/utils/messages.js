// we have to fetch the text and return it with a timestamp each time
// in both chat.js and index.js, rahter than repeating ourselves again and again
// we create a new file to export this function

const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}
const generateLocation = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocation
}