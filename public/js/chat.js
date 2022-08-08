const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
// query button already gets seleted in one go(no sub elements)
const $locationsenderbutton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const errorTemplate = document.querySelector('#error-template').innerHTML

// Options
//ignoreQueryPrefix removes ? from each attribute from the url
const querystring = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = () => {
    // get newest message element
    const $newMessage = $messages.lastElementChild

    // accessing margins of new message, this gives css properties object for messge component
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)

    // get height of the newest messge element
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (Math.round(containerHeight - newMessageHeight) <= Math.round(scrollOffset) + 8 * newMessageHeight) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


// socket is an object that is being passed back and forth between
// index.js(server js) and chat(js) client js
// socket.on() and socket.emt
socket.on('message', (message) => {
    console.log(message)
    if (message.text != "") {
        const html = Mustache.render(messageTemplate, {
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format('hh:mm a')
            // moment.js library to format time in HH:mm
        })
        $messages.insertAdjacentHTML('beforeend', html)
        autoscroll()
    }
})

//location message listener
socket.on('locationMessage', (locationobject) => {
    console.log(locationobject)
    const html = Mustache.render(locationTemplate, {
        username: locationobject.username,
        locationurl: locationobject.url,
        createdAt: moment(locationobject.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit', (e) => {
    // form has submit even type by default when we click the button
    // e is short form for event, i.e event object being passed down by event handlers
    e.preventDefault() // makes it so that form does not refresh after sumbit

    // set value of disable attribute of submit button to disable it
    $messageFormButton.setAttribute('disabled', 'disabled')
    // const Sent_message = document.querySelector('input').value
    // earlier we were selecting the input element by its tags
    // but what if there are multiple inputs ? our code will break, so we give name to our input as name = "message"
    // now we  use event object to target element with name 'message'
    const Sent_message = e.target.elements.message.value
    socket.emit('SendMessage', Sent_message, (error) => {
        //enable button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = '' // empyty form
        $messageFormInput.focus() // move cursor inside form

        // here error is a string, it is null if no error occurs
        if (error) {
            const html = Mustache.render(errorTemplate, {
                error
            })
            $messages.insertAdjacentHTML('beforeend', html)
            return console.log(error)
        }
        console.log('Message delivered!')
    })

})

// function for sending location

$locationsenderbutton.addEventListener('click', () => {
    $locationsenderbutton.setAttribute('disabled', 'disabled')
    // Modern browsers support Geo Location API
    // if they don't
    if (!navigator.geolocation) {
        return alert('Geolocation is not supp0orted by your browser.')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        // location information gets stored in positon object by web browser
        // console.log(position.coords.latitude) //now we know about stuff in position object
        var array = [position.coords.latitude, position.coords.longitude]
        socket.emit('send--location', array, () => {
            $locationsenderbutton.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    })
})

socket.emit('join', querystring, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

