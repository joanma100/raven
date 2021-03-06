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

var Future  = require('data.future');
var Maybe   = require('data.maybe');
var { parallel } = require('control.async')(Future);
var path    = require('path');

module.exports = function(window, document, $, md, gui) {
  global.window         = window;
  global.document       = document;
  global.navigator      = window.navigator;
  global.jQuery         = window.$;
  global.htmlToMarkdown = md;
  global.WebkitUI       = gui;

  var utils   = require('./utils');

  var storage = (function() {
    var store = window.localStorage;
    
    return {
      at: function(key) {
        return new Future(function(reject, resolve) {
            key in store?    resolve(JSON.parse(store[key]))
          : /* otherwise */  reject(new Error('Key not in the storage'))
        })
      },

      put: function(key, value) {
        return new Future(function(reject, resolve) {
          store[key] = JSON.stringify(value);
          resolve(store[key])
        })
      }
    }
  }());

  var screenManager = (function() {
    var screenMap = {};
    var history = [];
    var current = null;
    var TRANSITION_DELAY = 300;

    function removeScreen(screen, preserve) {
      return new Future(function(reject, resolve) {
        if (screen) {
          $(screen).addClass('fading');
          setTimeout(function() {
            if (!preserve) {
              React.unmountComponentAtNode(screen)
              $(screen).detach();
            } else {
              $(screen).addClass('hidden')
            }
            resolve()
          }, TRANSITION_DELAY)
        } else {
          resolve()
        }
      })
    }
    
    function back() {
      return new Future(function(reject, resolve) {
        var screen = history.pop()
        if (!screen) {
          reject(new Error('No history available.'))
        } else {
          utils.run($do {
            removeScreen(current, false);
            return $(screen).removeClass('fading hidden')
            return current = screen;
            return resolve(current)
          })
        }
      })
    }

    function reset() {
      return $do {
        parallel(([current] +++ history).map(λ(s) -> removeScreen(s, false)));
        return history = [];
        return current = null;
      }
    }
    
    function newLayer() {
      return $(document.createElement('div')).addClass('layer').get(0)
    }


    function changeToScreen(stack, screen, data) {
      return !current?        new Future(λ(_, f) -> (doChange(), f()))
      :      /* otherwise */  $do {
                                removeScreen(current, stack);
                                return doChange()
                              };

      function doChange() {
        if (stack) {
          history.push(current);
        }
        var layer = newLayer();
        $('#app').append(layer);
        React.render(screen, layer);
        current = layer;
      }
    }

    function showDialog(screen) {
      return new Future(function(reject, resolve) {
        history.push(current);
        var layer = newLayer();
        $('#app').append(layer);
        React.render(screen, layer);
        current = layer;
      });
    }

    function navigate(stack, url, props, data) {
      console.log('>>> Navigating to ' + url);
      if (!(url in screenMap))
        throw new Error('No screen for ' + url);

      return changeToScreen(stack, screenMap[url](props), data);
    }

    function register(url, screen) {
      if (url in screenMap)
        throw new Error(url + ' is already registered.');
      
      screenMap[url] = screen;
    }

    return {
      changeTo: changeToScreen,
      showDialog: showDialog,
      navigate: navigate,
      register: register,
      back: back,
      reset: reset,
      STACK: true,
      DONT_STACK: false
    }

  }());


  var React   = require('react/addons');
  var Screens = require('./screens')(screenManager, storage);

  screenManager.register('/', Screens.Entry);
  screenManager.register('/editor', Screens.Editor);
  screenManager.register('/dialog/settings', Screens.SettingsDialog);
  screenManager.register('/dialog/about', Screens.AboutDialog);
  screenManager.register('/dialog/import', Screens.ImportDialog);
  screenManager.register('/dialog/story/meta', Screens.StoryDialog);
  screenManager.register('/dialog/story/export', Screens.ExportDialog);


  return storage.at('settings.home').cata({
    Rejected: λ(_) -> screenManager.changeTo(screenManager.DONT_STACK, Screens.SetupFolder()),
    Resolved: λ(_) -> screenManager.changeTo(screenManager.DONT_STACK, Screens.Entry())
  }).chain(λ(a) -> a);

}
