import _ from 'lodash'
import {useEffect, useMemo, useRef, useState} from 'react'
import getDatabase from '../config/firebase'
import {Box, Button, Input, Text} from 'theme-ui'

export default ({sender, primaryChat, primaryChatName, subscribedChats}) => {
  const [updated, setUpdated] = useState(null)
  const chatsRef = useRef()

  useEffect(() => {
    chatsRef.current = {}
  }, [])

  useEffect(() => {
    subscribedChats.forEach((key) => {
      if (!chatsRef.current[key]) {
        console.log('subscribing to', key)
        getDatabase()
          .ref(`chats/${key}`)
          .on('value', (snapshot) => {
            chatsRef.current = {...chatsRef.current, [key]: snapshot.val()}
            setUpdated(new Date().toISOString())
          })
      }
    })
  }, [chatsRef, subscribedChats])

  const sendMessage = (message) => {
    getDatabase().ref(`chats/${primaryChat}`).push().set({
      sent: new Date().toISOString(),
      message,
      sender,
      chat: primaryChat,
      chatName: primaryChatName
    })
  }

  const onMessage = (e) => {
    e.preventDefault()
    const messageInput = document.getElementById('message')
    const message = messageInput.value
    messageInput.value = ''
    if (message.length > 0) {
      sendMessage(message)
    }
  }

  const messagesToRender = useMemo(() => {
    console.log('rendering messages', chatsRef.current)
    return _.sortBy(
      Object.values(chatsRef.current || {})
        .map((chat) => Object.values(chat || {}))
        .flat(),
      'sent'
    ).reverse()
  }, [chatsRef.current])

  const disabled= !primaryChat
  return (
    <Box variant="vertical">
      <Box as="form" sx={{display: 'flex'}} onSubmit={onMessage}>
          <Input m={1} id="message" placeholder="Type chat message..." disabled={disabled}/>
          <Button m={1} type="submit" disabled={disabled}>&gt;</Button>
      </Box>
      <ul>
        {messagesToRender.map((message) => (
          <li>
            ({message.sender} in {message.chatName})<br />
            {message.message}
          </li>
        ))}
      </ul>
    </Box>
  )
}
