class Session {
  constructor() {
    this.Id = null;
    this.Name = "";
    this.ServerSets = {};
  }

  SetUp() {
    CallServer({}, '/api/CreateSession', (Response) => {
      this.Id = Response.Id;
    });
  }
}

export let CurrentSession = new Session();

document.addEventListener('DOMContentLoaded', () => {
  CurrentSession.SetUp();
});

/**
 * @param {JSON} Data 
 * @param {String} Url  
 * @param {function(JSON)} Callback  */
export function CallServer(Data, Url, Callback) {
  Data.SessionId = CurrentSession.Id;

  const Xhr = new XMLHttpRequest();
  Xhr.open('POST', Url, true);
  Xhr.setRequestHeader('Content-Type', 'application/json');

  Xhr.onreadystatechange = function () {
    if (Xhr.readyState === 4 && Xhr.status === 200) {
      let Response = JSON.parse(Xhr.responseText);
      Callback(Response.Response);
    }
  };

  Xhr.onerror = function () {
    SetScene("SomethingWentWrong");
    throw new Error('Network error occurred.');
  };

  // Send the data as a JSON string
  Xhr.send(JSON.stringify({ Message: Data }));
}