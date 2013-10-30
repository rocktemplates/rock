

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
      --version              Print version and exit.
      -r ROCK, --rock ROCK   The rock path or Github repo.
      -c, --config           The config file. Defaults to ~/.rock/rock.conf.json


want to create a project from a rock hosted somewhere else? No problem:

    rock myapp -r git@github.com:johndoe/myrepo.git

or use Github shorthand a la [component](https://github.com/component/component)

    rock myapp -r johndoe/myrepo


Make Your Own Rocks
-------------------

It's stupidly simple to make your own rocks. Create a Git repository on Github or an empty directory on your filesystem. Start making template files. 

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

### Ignore Directories

In your rock repo, add a file `.rock/rock.json`. Add the following:

```json
{
    "ignoreDirs": ["./dirToIgnore"]
}
```

Why would you do this? Let's say that you're calling rock programmatically and you don't want rock to prompt you for any tokens because you are going to use Mustache/Hogan/Handlebars in your own code.


### Open / Close Templates

If you don't want to use the default `{{` and `}}` and want to use something else, you can configure this behavior for your Rock:

```json
{
  "tokens": {
    "open": "#{",
    "close": "}"
  }
}
```

You may want to do this if you  generate files that actually use Mustache templates.



Single File Rocks
-----------------

Rock doesn't need to be used with just whole repos. It can be used with individual files as well.

**Example:**

**http://localhost/data.txt**:
```
Hi, @@author@@ is going to build:
@@project-name@@.
```

command:

    rock /tmp/outputfile.txt -f --topen '@@' --tclose '@@' -r http://localhost/data.txt


prompts:

```
author: JP
project-name: Rock
```

output:

**/tmp/outputfile.txt**:
```
Hi, JP is going to build:
Rock
```



rock.conf.json
--------------

This file defaults to `~/.rock/rock.conf.json`. You can set default values (prompt or skip).

```json
{
  "templateValues": {
    "author": "JP Richardson"
  },
  "defaultValues": {
    "email": "jprichardson@gmail.com"
  }
}
```

So, if you were to run:

    rock myapp -r rocktemplates/node-bin 

it would not prompt you for `author` and it would prompt you for `email` but with a default of `jprichardson@gmail.com`.



Rocks
------

See more rocks at: https://github.com/rocktemplates or browse 3rd party Rocks here: https://github.com/rocktemplates/rock/wiki/rocks


[1]: https://github.com/rocktemplates
[2]: http://nodejs.org/dist/latest/



Roadmap to v1.0.0
------------------

- Will probably change configuration from JSON to [TOML](https://github.com/mojombo/toml). TOML needs to
achieve stability first.
- Create/fork site similar to [component.io](http://component.io/)


Contributors
------------

- (*) [JP Richardson](http://github.com/jprichardson)
- (1) [Tayler Summers](https://github.com/taylers)


License
-------

(The MIT License)

Copyright (c) 2012-2013, JP Richardson


[aboutjp]: http://about.me/jprichardson
[twitter]: http://twitter.com/jprichardson
[procbits]: http://procbits.com
[gitpilot]: http://gitpilot.com

