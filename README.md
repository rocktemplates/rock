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

**Note:**
At this time, `rock` requires `git` to be installed. This is because all the templates are hosted on Github. Since Github also provides tarballs and zipballs, this requirement will change soon.


### After Install

After install, `rock` will create the file `rockconf.json` in your `~/.rock/` directory. You can modify this file to include additional repositories if you like.



Usage
-----

    rock [path] -r [rock]

example:

    rock mylib -r node-lib
or

    rock /tmp/mylib -r node-lib


### Options

    Options:
     -l, --list    show available rocks
     -r, --rock    rock name or repo   
     -c, --config  config file path      [default: "/Users/jp/.rock/rockconf.json"]

view all rocks in your config file:

    rock --list

want to create a project from a rock hosted somewhere else? No problem:

    rock myapp -r git@github.com:johndoe/myrepo.git



Make Your Own Rocks
-------------------

It's stupidly simple to make your own rocks. Create a Git repository anywhere. It could be on your filesystem, Github, BitBucket, wherever. Start making template files in this Git repository. Don't forget to commit.

Example (myproject.js):

```javascript
/*
   Author: {{author}} <{{email}}>
   File: {{file}}
   Created: {{date}}
*/

function main() {
	
}
```

Now, when you run:

    rock myproj -r /path/to/my/rock/repo

Rock will prompt:

    author: [YOU_TYPE_YOUR_NAME_HERE]
    email: [YOU_TYPE_YOUR_EMAIL_HERE]


Rock, then will create the file structure of your new project with the values of your template tokens replaced with what you typed. Rock already understands `file`, `date`, and few others.


[1]: https://github.com/rocktemplates
[2]: http://nodejs.org/dist/latest/



