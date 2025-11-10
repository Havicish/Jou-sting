function Start() {


const AddAPIListener = require("./server.js").AddAPIListener;

let Sessions = [];

AddAPIListener("/api/CreateSession", (Req, Body) => {
  let NewSession = {
    Id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  };
  Sessions.push(NewSession);
  return { Response: { Id: NewSession.Id } };
});

AddAPIListener("/api/UpdateSession", (Req, Body) => {
  let Data = JSON.parse(Body).Message;
  let Session = Sessions.find(s => s.Id === Data.Id);
  if (Session) {
    // Update session properties
    Object.assign(Session, Data);
    return { Response: { Success: true } };
  }
  return { Response: { Success: false, Error: "Session not found" } };
});


}

module.exports = { Start };