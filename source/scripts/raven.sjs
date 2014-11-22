// Copyright (c) 2014 Quildreen Motta <quildreen@gmail.com>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


var ui = require('nw.gui');
var Signal = require('./scripts/signal');

window.Intent = {
  quit: new Signal()
};

window.onload = function() {
  require('./scripts/main')(window, document, jQuery, md, ui).fork(
    function(error) {
      console.error(error);
      alert('An error prevented Raven from being started.');
    },
    function() { }
  );
};


ui.Window.get().on('close', function() {
  var self = this;
  Intent.quit.trigger(null).fork(
     function error(){ },
     function success(){
       self.close(true)
     }
   )  
})

$('#app-close-button').on('click', function() {
  ui.App.closeAllWindows()
})


if (process.platform === 'darwin') {
  Mousetrap.bind("command+a", function() {
    document.execCommand("selectAll");
  });

  Mousetrap.bind("command+x", function() {
    document.execCommand("cut");
  });

  Mousetrap.bind("command+c", function() {
    document.execCommand("copy");
  });

  Mousetrap.bind("command+v", function() {
    document.execCommand("paste");
  });

  Mousetrap.bind("command+u", function() {
    document.execCommand("underline");
  });
}

Mousetrap.bind("ctrl+shift+i", function() {
  ui.Window.get().showDevTools('raven', false);
});
