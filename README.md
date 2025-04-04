# It's a Painting. It's Light Switch.

![](/docs/CoverPhoto.jpg)

Light up a Govee Lightwall with a Raspberry Pi, an Adafruit touch hat (MPR121 capacative sensor), some conductive tape, and an adorable painting from a 7 year old.

## The Problem

After implulse buying a giant LED light curtain ([Govee brand](https://us.govee.com/products/govee-curtain-lights?variant=43239869513913)) for my kiddos room and painstakingly hanging it above her bed, we discovered the only way to really control it is with an app. It's a lovely app, don't get me wrong, but Mom or Dad's phone is not the most accessible interface for a 7 year old. Luckily, Govee has a pretty decent API for their products, and double luckily, I had a couple spare Raspberry Pis lying around.

![](/docs/lightwall-touch.gif)

## The Solution

After kicking around a few ideas for alternative controls (gamepads, tiny keyboards, a small touchscreen) and browing Adafruit, I landed on the [Adafruit Capacitive Touch HAT](https://www.adafruit.com/product/2340) for Raspberry Pi. 

![](/docs/adafruit.jpg)

This left options wide open  -  I could make buttons out of pretty much anything. I can't remember where the painting idea came from, but I was pretty excited to try it. After much trial and error, a lot of vibe coding, a few late nights and early mornings I managed to get it done. Details below...

**Stuff**

The finished product contains roughly $100 in materials. A lot for a lightswitch, but the memories are priceless.

- Raspberry Pi 3a*(or better) with SD Card and power supply
- Adafruit Capacitive Touch HAT
- A roll of capacitive tape
- A small canvas
- Some wire and solder
- Maybe a connector thingy

## Assembly

**Raspberry Pi**

Install the latest [Raspbian server](https://www.raspberrypi.com/software/) on your favorite brand of SD card (or USB stick if you accidentally snapped the sd slot cover).  

Turn on "I2C", "Remote GPIO", and probably "SSH" in `respi-settings` and get i2c-tools with `sudo apt-get install -y i2c-tools`.  

Finally install nodejs (I like [nvm](https://github.com/nvm-sh/nvm), but you do what feels good). Create a project folder and `npm install` the `i2c-bus` package. This will get you enough to start working with the touchy touchy.

**MPR121 - aka Adafruit Capacitive Touch HAT**

Put the hat on the Pi! It fits oh-so-satisfyingly right on top. Just like a comfy... hat.  If you have some alligator clips, you can test it out by clipping a few wires to the little nubmered circles on the hat and running some test code on the Pi now.  Check out the README for the node.js [MPR121 library](https://www.npmjs.com/package/mpr121). 

![MPR121](/docs/mpr121.jpeg)

**The Painting**

So with a Raspberry Pi equipped with a touch sensor, I was able to solder some wires into each touch sensor (the numbered pairs of copper holes). Instead of using individual wires like a normal person, I found an overly bulky 12-wire "pigtail" connector on Amazon.  You know, just in case I wanted to remove the Pi AND the touch HAT from the painting, without pulling the wires out of the canvas.  Remains to be seen if that was necessary.

![](/docs/connector.jpeg)

Anyway, I poked 12 holes in a cheap canvas I bought at Micheal's for $6 and used copious loads of electrical tape to keep the Pi and all the wires in place.

![](/docs/full-device-in-canvas.jpeg)

Flipping the canvas over, I smushed the wires sticking out of the front and covered the end of each one in conductive tape.  So in the end, I had a canvas with a handful of gold squares smattered about.

![](/docs/cat.jpeg)

This is what my kid had to "paint" on.  I pointed out which squares did what - on, off, brighter, dimmer, nighttime lights, party lights, holiday lights, etc... and she went to town.

## The Software

The code to get this all working together has three elements:

- A Govee API wrapper to turn the lights on and off, adjust brightness, and set the "scene"
- A fork of the `mpr121` node.js library to allow some sensitivity adjustments
- A main program to tie the touch library to the Govee API

### MPR121 Library

I had to fork a local copy of the MPR121 library to adjust the touch and release thresholds. There's a function to alter them, but calling it after the module initializes doesn't actually do anything. Around linke 162 in index.js I set it to: `return this.setThresholds(25, 15)` which seemed to be OK.  There were still quite a bit of false positives (touch when there weren't any) AND false negatives (touching registers nothing), but after a good bit of trial and error, this is the best I could land on for conductive tape with some paint smeared on it. I also had Claude document every line for funsies. 

### Govee API Wrapper

Govee has a pretty decent [API](https://developer.govee.com/reference/apply-you-govee-api-key) for all its products, and it's free.  I tried "vibe coding" a Govee API wrapper, but quickly noticed my AI buddy using the wrong version of the API for my device, so I had to download the documentation locally and use that as context when having Claude barf out code. Modern problems require modern solutions. 

The wrapper is pretty barebones. I just included what I needed, and a lot of the functionality is in a single API endpoint and the function and data values are passed in as JSON payloads. It uses an API key as a bearer token for auth, and devices are identified by MAC address.  All this info is shoved into a config file.

### Putting It All Together

The main application connects the touch inputs from the MPR121 sensor to specific Govee light commands. When a painted area is touched, the corresponding light command is sent to the Govee light wall through the API wrapper. Basic functionality like "ON" and "OFF" were pretty straightforward. Changing to a specific "scene" is simple as well, but I wanted the "buttons" to each cycle through a series of collected scenes.  For example, tapping the bat in a cave turns on a nighttime scene and tapping it again goes to the next nighttime scene. Most of the `handleTouch` code revolves around rotating through the scenes and sending the appropriate command to the Govee API via the wrapper function. 

When I first started testing the device, it worked surprisingly well.  However, for its initial 24 hour voyage, it popped on at 3am at full brightness.  Nobody was happy about this.  That's when I added the `isAllowedTime` function which effectively disables any and all calls to the GoveeAPI between 8pm and 8am. It's been humming along ever since.

My final task was to attach it to the wall.  A custom 3d printed "command hook" was my final task before shipping this baby to prod. 

## THE END
