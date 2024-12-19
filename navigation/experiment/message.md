---
layout: base
title: Message Testing
permalink: /experiment/message
---

<style>
    .message-box {
      background-color: #f1f1f1; /* Light gray background */
      border: 1px solid #ccc; /* Light gray border */
      border-radius: 10px; /* Rounded corners */
      padding: 15px; /* Space inside the box */
      font-family: Arial, sans-serif; /* Font styling */
      font-size: 16px; /* Text size */
      color: #333; /* Text color */
      width: 300px; /* Box width */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
      margin: 20px auto; /* Center the box and add spacing */
    }
</style>

<h1>Press Space</h1>

<div id="message"></div>

<script type="module">
    import Message from'{{site.baseurl}}/assets/js/experiment/message.js';
    
    // Define your message array
    const messageArray = [
      "Hello World",
      "Hello Universe",
      "Hello Galaxy",
      "Hello Multiverse",
      "Hello Parallel Universe"
    ];

    // Create the message object
    const messageInstance = new Message(messageArray);

    // Add event listener for key press (space bar)
    document.addEventListener("keydown", (event) => {
      messageInstance.keyPressed(event);
    });
</script>
