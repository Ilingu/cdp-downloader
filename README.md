# cdp-downloader

#### ➡️ 'Cahier de Prépa' Downloader

## Purpose

1. Have fun
2. Learn Bun (since v1 just came out)
3. Speed coding

## Origin

I'm a french student in CPGE, and some of my professors use the tool 'Cahier de Prépa'.

In their we can download a lot a files (such as exercices, lectures...).

And I'd like to replicate the file tree in my local machine (to ease things out, and in case of an internet problem still have a copy)

Here is the problem, there is a lot of files and folders and nested files in folder... Such a pain in the ass to download and replicate all the folders and files in my system _(because 'Cahier de Prépa' doesn't provide an "download all" option...)_

As a consequence I spend **7 hours** creating a script to do that for me instead of spending ~30 min doing by hand _(classic behavior for a programmer)_.

But it works! And now I can write "expert in Bun" in my resume 😎

## Install

> !!! You must have **Bun installed** in your machine
>
> !!! You must use **linux**

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
# or
npm build
bun ./build/index.js
```

## Usage

```bash
bun run index.ts --verbose -i <folder name inside cdp> -o <local folder to save to result> -u <login identifier> -p <password>
```

ex:

```bash
bun run index.ts -i physique -o /home/me/School/CPGE/Physique -u ilingu -p ihad2CatsbutOnEisDeadsoNowitsOnly1
```

## Made with:

1. **Elegance** ✅
2. `TypeScript` ✨🦀
3. [Bun](https://bun.sh) _v1.0.0_ ♥ (awesome btw, **bun >> node**)
