class Message {
    constructor(messages) {
      this.messages = messages;
      this.index = 0;
    }

    updateMessage() {
      if (this.index >= this.messages.length) {
        this.index = 0; // Reset if it goes beyond available messages
         document.getElementById("message").innerHTML = ""; // reset message box
      } else {
          document.getElementById("message").innerHTML = `<div class="message-box">${this.messages[this.index]}</div>`;
          this.index++;
      }
    }


    keyPressed(event) {
      if (event.keyCode === 32) { // Space key pressed
        this.updateMessage();
      }
    }
}

export default Message;