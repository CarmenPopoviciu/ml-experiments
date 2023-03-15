# Message in a bottle, yeah

[![The Police - Message in a bottle]
(https://img.youtube.com/vi/4m3CMTeo-nU/maxresdefault.jpg)]
(https://www.youtube.com/watch?v=4m3CMTeo-nU)

## Description

This demo shows how to use predictions produced by the [Tensorflow Toxicity classifier](https://github.com/tensorflow/tfjs-models/tree/master/toxicity/demo).
It is a basic experiment to showcase how ML models could be run on [Cloudflare Workers](https://workers.cloudflare.com/).

Live demo is available [here]().

## Requirements

To run this project locally, you need [Node.js](https://nodejs.org/) version `16.13.0` or higher.

## Setup

Install dependencies:

```sh
yarn
```

Launch a dev server and code away:

```sh
yarn dev
```

Application will be available at `http://127.0.0.1:8788/`

Publish as [Pages](https://pages.cloudflare.com/) project:
```sh
yarn publish:to-pages
```