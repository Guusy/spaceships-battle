class SocketService {
  init(server) {
    this.io = require("socket.io").listen(server);
  }

  addSocket(socket){
    //TODO: handle multiple sockets
    this.socket = socket
  }


}

module.exports = new SocketService();
