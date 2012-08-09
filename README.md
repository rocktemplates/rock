Node.js - rock
=================

Rock generates file structures or project skeletons based off of predefined templates. You can find a list of all of the templates on the [Github rocktemplates page][1].


Why?
----

Do you constantly finding yourself writing a lot of new libraries for Node.js and having to create the `package.json`, `README`, `LICENSE`, `lib/`, `test/` files over and over again? Well, I did. Sometimes I was writing JavaScript libraries or CoffeeScript apps. But over and over I was getting annoyed of having to create the same file structure over and over again.

I stumbled upon a few solutions, but they all seem to do more than just generate a file structure from a template. That's all I wanted. Oh, and I wanted it to be programmatic too. So, if I wanted to build a blogging engine or another Rails clone in JS, I could leverage `rock` to generate the empty templates.

As it stands now, `rock` is written in Node.js. But the actual templates themselves could be for any language.



Installation
------------

You will need Node.js and `npm` (Node.js Package Manager). This is included in the downloadable Node.js packages. If you don't have `npm`, mozy on over to the [latest Node.js package page][2]. There are prebuilt binaries and installers for most platforms including Mac OS X, Windows, and Linux.

After you have installed Node.js and npm, you can install rock by running the following command:

    npm install -g rock

Don't forget the **-g** flag. This will ensure that the `rock` command is available system wide.






[1]: https://github.com/rocktemplates
[2]: http://nodejs.org/dist/latest/