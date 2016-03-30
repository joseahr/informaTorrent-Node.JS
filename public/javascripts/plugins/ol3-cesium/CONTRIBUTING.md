# Contributing to Ol3-Cesium

Thanks for your interest in contributing to Ol3-Cesium.

## Contributing Code

Our preferred means of receiving contributions is through [pull requests](https://help.github.com/articles/using-pull-requests). Make sure
that your pull request follows our pull request guidelines below before submitting it.

This page describes what you need to know to contribute code to ol3-cesium as a developer.

## Contributor License Agreement

Before accepting a contribution, we ask that you provide us a Contributor
License Agreement.  If you are making your contribution as part of work for
your employer, please follow the guidelines on submitting a [Corporate
Contributor License Agreement](https://raw.github.com/openlayers/cla/master/ccla.txt). If you are
making your contribution as an individual, you can submit a digital [Individual
Contributor License Agreement](https://docs.google.com/spreadsheet/viewform?formkey=dGNNVUJEMXF2dERTU0FXM3JjNVBQblE6MQ).

## Setting up development environment

You will obviously start by
[forking](https://github.com/openlayers/ol3-cesium/fork) the ol3-cesium repository.

### Cloning the repository

Make sure you clone the repositiory using `git clone --recursive` command.

## Working with the build tool

As an ol3-cesium developer you will need to use the `make` command in order
to run the linter, the compiler, the tests, etc.

The targets can be invoked using:

    $ make <target>
    
where `<target>` is the name of the target you want to execute. For example:

    $ make dist

## Compliler version

The version of the compiler may be changed by creating a file closure-util.json
at the root of the project. See [available options](https://github.com/openlayers/closure-util/blob/master/default-config.json)
and [available compilers](https://github.com/google/closure-compiler/wiki/Binary-Downloads).

## Pull request guidelines

Your pull request should follow the OpenLayers 3 guidelines.

### The `check` build target

It is strongly recommended that you run

    $ make check

before every commit.  This will catch many problems quickly.

The `check` build target runs a number of quick tests on your code.  These
include:

 * Lint
 * Compile
 * Tests


### Follow OpenLayers 3's coding style

The OpenLayers 3's coding style should be followed except as specified below.

For readablitiy, testing for `undefined` and `null` must be handled as follows:

- In the case of numbers, strings and booleans: use `goog.isDef`;
- In the case of objects: use `goog.isNull` or `the object itself`;
- In all cases where the type is unknown, like with templates: use `goog.isDefAndNotNull`.



### Address a single issue or add a single item of functionality

Please submit separate pull requests for separate issues.  This allows each to
be reviewed on its own merits.


### Contain a clean history of small, incremental, logically separate commits, with no merge commits

The commit history explains to the reviewer the series of modifications to the
code that you have made and breaks the overall contribution into a series of
easily-understandable chunks.  Any individual commit should not add more than
one new class or one new function.  Do not submit commits that change thousands
of lines or that contain more than one distinct logical change.  Trivial
commits, e.g. to fix lint errors, should be merged into the commit that
introduced the error.  See the [Atomic Commit Convention on Wikipedia](http://en.wikipedia.org/wiki/Atomic_commit#Atomic_Commit_Convention) for more detail.

`git apply --patch` and `git rebase` can help you create a clean commit
history.
[Reviewboard.org](http://www.reviewboard.org/docs/codebase/dev/git/clean-commits/)
and [Pro GIT](http://git-scm.com/book/en/Git-Tools-Rewriting-History) have
explain how to use them.


### Use clear commit messages

Commit messages should be short, begin with a verb in the imperative, and
contain no trailing punctuation. We follow
http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
for the formatting of commit messages.

Git commit message should look like:

    Header line: explaining the commit in one line

    Body of commit message is a few lines of text, explaining things
    in more detail, possibly giving some background about the issue
    being fixed, etc etc.

    The body of the commit message can be several paragraphs, and
    please do proper word-wrap and keep columns shorter than about
    74 characters or so. That way "git log" will show things
    nicely even when it's indented.

    Further paragraphs come after blank lines.

Please keep the header line short, no more than 50 characters.

### Be possible to merge automatically

Occasionally other changes to `master` might mean that your pull request cannot
be merged automatically.  In this case you may need to rebase your branch on a
more recent `master`, resolve any conflicts, and `git push --force` to update
your branch so that it can be merged automatically.
