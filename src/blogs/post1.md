---
title: The Making of Blendah
date: 7 June, 2026
subtitle: How I built a terminal-based 3D modeling app inspired by Blender and Neovim
thumbnail: ./src/blogs/thumbnail/post1.webp
tag: Programming
---

Everyone thinks making 3D modeling software is very difficult, and to be honest, that is true. But you do not need to be a programming wizard to make a simple 3D modeling app. In this blog, I am going to discuss how I made **[Blendah](https://github.com/omnimistic/blendah)**, my in-the-terminal 3D modeling app.

## How I came up with the idea

I just love making unconventional stuff that no one would ever think of making. One day, I was thinking about recreating Neovim, and then I started thinking about making a 3D modeling app. And then my mind just combined the two ideas and thought, *"A 3D modeling app like [Blender](https://www.blender.org/), but in the terminal like [Neovim](https://neovim.io/)"* — and that’s how [Blendah](https://github.com/omnimistic/blendah) was born.

## Tech Stack

I wanted to make it as efficient as possible, so naturally, I decided to use C++ as that is the only language in my tech stack that gave me the freedom and speed that I wanted. After doing some preliminary research, I found the *[tinyobjloader](https://github.com/tinyobjloader/tinyobjloader)* library, which is a fast, dependency-free, single-header C++ library used to parse Wavefront `.obj` 3D mesh files and `.mtl` material files. I initially wanted to write my own basic rendering engine, but *[FTXUI](https://github.com/ArthurSonzogni/FTXUI)* just gave better results than whatever I could write, so I just stuck with it.

## The Rendering Logic

I did not use any big graphics API to make this project. I had watched this video by [Tsoding](https://www.youtube.com/@Tsoding) called *[One formula that demystifies 3D graphics](https://youtu.be/qjWkNZ0SXfo?si=u6TWsIbMG6QxYh-G)*, where he taught about perspective divide and I wanted to use it instead.

A computer screen (or in this case, a terminal window) is 2D. It only has an X and Y axis. So how do we show Z (depth)?
We use a neat trick called the Perspective Divide. In the real world, when objects move further away from us, they look smaller and closer to the center of our vision. Mathematically, the easiest way to make a number smaller is to divide it.

To put our 3D points onto the flat terminal screen, we take the X and Y positions of a point and divide them by its Z depth:
`X_screen = X / Z`
`Y_screen = Y / Z`

If a point has a huge Z value (meaning it is far away), dividing X and Y by that large number squishes the result down, pulling it right into the center of the screen. We then multiply that result by a scale number to stretch it across the terminal grid, and just like that, we have the illusion of 3D depth on a flat screen.

I could not find any proper article that talks about prespective divide but you can check out the Wikipedia articles on [3D projection](https://en.wikipedia.org/wiki/3D_projection) and [Graphical Perspective](https://en.wikipedia.org/wiki/Perspective_(graphical)) and I would highly suggest you to watch the [video](https://youtu.be/qjWkNZ0SXfo?si=u6TWsIbMG6QxYh-G) by Tsoding.

## Implementing Rotation

Because we are dealing with raw coordinates, we have to rotate the points manually.

If you look straight down at a 3D model, spinning it means every point draws a perfect circle on the ground. We can calculate any point on that circle using trigonometry.

First, we find the starting point based on its distance from the center ($r$) and its starting angle ($\alpha$):

$$
x = r \cos(\alpha) \\\\
z = r \sin(\alpha)
$$

When we rotate the model, we add a new angle ($\theta$) to the starting angle:

$$
x' = r \cos(\alpha + \theta) \\\\
z' = r \sin(\alpha + \theta)
$$

Using angle addition formulas, we expand this:

$$
\begin{align*}
x' &= r \bigl( \cos(\alpha)\cos(\theta) - \sin(\alpha)\sin(\theta) \bigr) \\\\
z' &= r \bigl( \sin(\alpha)\cos(\theta) + \cos(\alpha)\sin(\theta) \bigr)
\end{align*}
$$

After substituting back the original $x = r \cos(\alpha)$ and $z = r \sin(\alpha)$, we arrive at the standard **2D rotation formula**:

$$
\begin{align*}
x' &= x \cos(\theta) - z \sin(\theta) \\\\
z' &= z \cos(\theta) + x \sin(\theta)
\end{align*}
$$

By applying this to every vertex (with small sign adjustments for terminal coordinate layout), we can rotate thousands of points around the Y-axis using only basic `sin()` and `cos()` functions.

## The .obj Format

Before I started this project, I used to think that 3D files were very complex. I have been making games for almost a decade now, and in that time I have made plenty of 3D models, but I never looked into how these files that I was exporting actually stored the 3D model. Well, it turns out, in the case of `.obj` files, they are quite straightforward.

A `.obj` file is basically just a plain text file that describes 3D geometry line by line. It uses specific letters (keywords) at the start of each line to tell the computer what that data is:

* `v`: Stands for **vertex**. This is a single point in 3D space, followed by its X, Y, and Z coordinates.
* `vt`: Stands for **vertex texture**. These are 2D coordinates that map an image (texture) to the model.
* `vn`: Stands for **vertex normal**. This tells the engine which way a surface is facing so it can calculate lighting.
* `f`: Stands for **face**. This connects the vertices together to form polygons (like triangles or squares). It lists the index numbers of the vertices.
* `mtllib` and `usemtl`: These link the object to a separate material file (`.mtl`) that contains color and lighting settings.

Here is the inside of an `.obj` file of the default Blender cube with a red material applied to it:

**cube.obj**

```text
# Blender v3.3.1 OBJ File: ''
# www.blender.org
mtllib cube.mtl
o Cube
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vt 0.625000 0.500000
... (other vt and vn lines)
usemtl Material
s off
f 1/1/1 5/2/1 7/3/1 3/4/1
f 4/5/2 3/4/2 7/6/2 8/7/2
... (other f lines)

```

**cube.mtl**

```text
# Blender MTL File: 'None'
# Material Count: 1

newmtl Material
Ns 250.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.026011 0.064866
...

```

But, because Blendah is just a wireframe engine, we do not care about drawing solid faces, textures, or lighting. We just use the tinyobjloader library to read the file, ignore all the complex material and texture data, and grab the raw `v` points. Then, we look at the `f` lines and break those solid faces down into individual lines (pairs of two points). When the app draws the screen, it simply draws a straight line between those pairs using Braille characters in the terminal.

## Loading and Writing Files

The beauty of the `.obj` structure is that it is just as easy to write as it is to load.

When you type `:export model_name.obj` in the Blendah command line, the engine just loops through the list of points that you just modified on your screen. It opens a standard output file and writes `v x y z` for every single point. Once the points are written, it loops through the original face data and adds the `f` lines right at the bottom.

You can take that exported file, drag it straight into Blender or any other 3D software, and your terminal-edited wireframe will instantly load as a perfect 3D model.

You can check out the source code, build it yourself, and mess around with it in your own terminal by visiting the repository here: https://github.com/omnimistic/blendah

Make sure to give it a star if you think it's cool!

Peace 🕊️

~omni