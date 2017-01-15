# React Redux BabylonJS Starter Kit

I was interested in 3D engines and looked into BabylonJS and wanted to look at how to get BabylonJS working within a React/Redux project.

My original starting point was the Quarto game from http://www.pixelcodr.com/projects.html (https://github.com/Temechon/Quarto)

Temechon last updated that game 3 years ago and I wanted to port it over using React for the UI and try to build a bridge between Redux and BabylonJS.
I wanted it also written in ES6 or TypeScript, so the davezuko starter kit was chosen as a starting point (this is a fork).

In the Redux world you have action creators generating 'events' that flow through the reducer to generate a minimal state.  The structure of this starter project is that there is a container (Selector) to generate the props for your components.  This starter project uses a fractal design, so the game not loaded until you visit the Route.  I've used this starter kit on a couple of other projects and I really like how easy it is to work with.

The original starter kit tries to be as unopinionated as possible.  I brought in a few libraries to convert over more to my way of thinking:
1. redux-saga - Used to monitor events and generate events (ie: game won).  This is because the reducer should be pure and not have side-effects.  Using sagas I was able to keep my reducer pure and just generate state for the React components on the page.
2. react-babylonJS - This is the Scene component and redux middleware.  I created an NPM so that it could be worked on separately and showcased here.

The original game was using BabylonJS 1.13.  I updated it to the latest version, which was since updated to TypeScript.  There were only a couple of breaking changes.  I also added Bootstrap, but it's really only used for the button to show/hide BabylonJS debug window.

I also bought the book [Learning BabylonJS] (http://learningbabylonjs.com/), which was authored by the same person that wrote the original Quarto.  I added a couple of concepts from the book like shadows and a skybox - it's a great book to dial all the basics.

# Getting Started

There are more detailed instructions from [github.com/davezuko/react-redux-starter-kit](https://github.com/davezuko/react-redux-starter-kit/).

```sh
$ git clone https://github.com/brianzinn/react-redux-babylonjs-starter-kit.git <my-project-name>
$ cd <my-project-name>
```
Then install dependencies and check to see it works. It is recommended that you use [Yarn](https://yarnpkg.com/) for deterministic installs, but `npm install` will work just as well.

```bash
$ yarn install    # Install project dependencies
$ yarn start      # Compile and launch (same as `npm start`)
```
If everything works, you should see the following:
![Quarto Screenshot](https://raw.githubusercontent.com/brianzinn/react-redux-babylonjs-starter-kit/master/quarto_screenshot.png)

I think I'll try to create a github pages with a working demo, but for now the screenshot will do.  It literally takes 5 minutes to get it running on your own machine...
