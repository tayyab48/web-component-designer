# web-component-designer

```It's now considered beta. It works, we use it in production, but there are many more features to come```

A HTML web component for designing web components and HTML pages based on PolymerLabs wizzywid which can easily be integrated in your own software.
Meanwhile polymer is not used anymore.

![image](https://user-images.githubusercontent.com/364896/117482820-358e2d80-af65-11eb-97fd-9d15ebf1966f.png)


## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer

     npm i @node-projects/web-component-designer

## Browser support

  - Chrome/Firefox & Safari

## Developing

  * Install dependencies
```
  $ npm install
```

  * Compile typescript after doing changes
```
  $ npm run build (if you use Visual Studio Code, you can also run the build task via Ctrl + Shift + B > tsc:build - tsconfig.json)
```

  * *Link node module*<br/>
```
  $ npm link 
```

## Using

At first you have to setup a service container providing services for history, properties, elements, ...

## Code Editor

You can select to use one of 3 code editors available (ACE, CodeMirrow, Monaco).
If you use one of the widgets, you need to include the JS lib in your index.html and then use the specific widget.

## TreeView

We have 2 tree components. One independent and one feature rich which uses FancyTree (and cause of this it needs JQuery and JqueryUI).

## DragDrop

If you'd like to use the designer on mobile, you need the mobile-drag-drop npm library.
Your index.html should be extended as follows:

    <link rel="stylesheet" href="/node_modules/mobile-drag-drop/default.css">
    <script src="/node_modules/mobile-drag-drop/index.js"></script>

## Keys

Pointer Tool:
alt:   select element behind
shift:  draw selection rect
ctrl:  add/remove from selection
ctrl+shift: pan

## Copyright notice

The Library uses Images from the Chrome Dev Tools, see
https://github.com/ChromeDevTools/devtools-frontend/tree/main/front_end/Images/src
and
https://github.com/ChromeDevTools/devtools-frontend/blob/main/LICENSE
