0.3.1 / 2013-10-30
------------------
* removed `preferGlobal`
* added `cl` require to `rock` bin (tayler / #10)

0.3.0 / 2013-05-02
------------------
* added `cl` dep
* updated deps
* renamed `create()` to `fetchRepo()`
* added ability to download single files
* added rudimentary support for other templates

0.2.0 / 2013-01-21
------------------
* Updated deps.
* Removed post-install script.
* Removed `--update` and `--list` flags.
* Support installing from Github without Git dependency.
* Support installing from Github using Github short-hand i.e. username/repo
* Added default values to skip and prompt.
* Changed config file name from `rockconf.json` to `rock.conf.json`.

0.1.1 / 2012-09-06
------------------
* Dependencies update.

0.1.0 / 2012-08-15
------------------
* Git not necessary for Rock located on the local machine. This helps with the programmability aspect.
* Code cleanup using `BatchFlow` and `readline-prompter`.
* `rock.create` now can take an input of values so that the the readline prompt doesn't display. Test passing.

0.0.7 / 2012-08-13
------------------
* Fixed bug that prevented rocks without `ignoreDirs` to be created.

0.0.6 / 2012-08-13
------------------
* Added `--update` command line arg.
* Now proceeds regardless of whether it can parse `rockconf.json`.

0.0.5 / 2012-08-12
------------------
* Fixed crashed on `rock --list`.

0.0.4 / 2012-08-12
------------------
* Rocks can now specify to have directories ignored by putting `ignoreDirs` in their `rock.json` file.

0.0.3 / 2012-08-11
------------------
* Fixed bug preventing rock from shutting down when using programatically.

0.0.2 / 2012-08-09
------------------
* Hopefully fixing early broken release.

0.0.1 / 2012-08-09
------------------
* Very early alpha release.