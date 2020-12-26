export const abstract = `
For centuries, mathematicians and artists have been fascinated by the beauty in polyhedra. While most are familiar with only a few of them, such as the Platonic solids, prisms, or pyramids, there are many more polyhedra to discover, with interesting properties and relationships to each other.

This application visualizes the relationships between the convex, regular-faced polyhedra. The 120 solids presented here can be transformed into each other by a network of operations. Select a solid below to manipulate it and to explore its relationships with other polyhedra.

[Platonic solids]: http://en.wikipedia.org/wiki/Platonic_solid
[Archimedean solids]: http://en.wikipedia.org/wiki/Archimedean_solid
[prisms]: http://en.wikipedia.org/wiki/Prism_(geometry)
[antiprisms]: http://en.wikipedia.org/wiki/Antiprism
[Johnson solids]: http://en.wikipedia.org/wiki/Johnson_solid
`

export const uniform = `
The uniform polyhedra are the Platonic solids, the Archimedean solids, and the infinite set of prisms and antiprisms.

A polyhedron is _uniform_ if all its faces are regular polygons and it is _vertex transitive_. That is, if you rotate any vertex to any other vertex, there is a way to make all the faces and vertices match up so that it looks like the original polyhedron.

The 5 Platonic solids are _regular_ polyhedra, meaning they only have one type of face. The Archimedean solids, prisms, and antiprisms are _semi-regular_, which means they can have more than one type of face.

The 13 Archimedean solids can be constructed from the Platonic solids by a set of operations:

* **truncate** - Cut each vertex off the solid leaving equal sized faces
* **rectify** - Cut each vertex off the solid at the midpoint
* **expand** - Pull the faces of the solid out
* **snub** - Pull the faces of the solid out and twist them

In contrast to the Archimedean solids, there are infinitely many prisms and antiprisms, one for each type of polygon. A small number are included here because of their relationship to the Johnson solids.
`

export const johnson = `
The 92 Johnson solids, named after Norman Johnson, are the *non-uniform* convex regular-faced polyhedra—solids whose vertices aren't transitive.

Almost all of the Johnson solids can be created by gluing together pieces of uniform polyhedra so that the dihedral angle between their faces remains less than 180 degrees. Even though there is no hard restriction on which polygons can be used, all the Johnson solids can be made using faces of 3, 4, 5, 6, 8 or 10 sides.
`

export const capstones = `
The majority of Johnson solids are created from combining _pyramids_, _cupolæ_, and _rotundæ_ with prisms and antiprisms.

These components are defined as such:

* **pyramid** - a set of triangles around a point with a regular polygon base. These can be sliced off from the tetrahedron, octahedron, and icosahedron.
* **cupola** - A set of alternating squares and triangles around a top polygon, with a base that has double the amount of sides. These can be sliced off the cantellated Archimedean solids.
* **rotunda** - Alternating sets of triangles and pentagons. Half of an icosidodecahedron.

The following operations are defined:

* **elongate** - Extend the solid with a prism
* **gyroelongate** - Extend the solid with an antiprism
* **bi** - Glue two pieces of the same type together

Cupolae and rotundae can be oriented two different ways: _ortho-_ means that opposite faces are aligned with each other, while _gyro-_ means that they are unaligned.
`

export const composite = `
The next group of Johnson solids are defined by _augmenting_, _diminishing_, and _gyrating_ uniform polyhedra.

These operations are defined:

* **augment** - add a pyramid or cupola
* **diminish** - diminish a pyramid or cupola
* **gyrate** - rotate a cupola

When more than one operation is applied, sometimes there is more than one way in which the solid can be modified. A solid _para-_ if the modified components are opposite each other, and _meta-_ if they are not.
`

export const elementary = `
The remaining Johnson solids cannot be created by gluing together other polyhedra.

Of those, two of them can be created by applying the snub operation to antiprisms. The remaining seven are named based on their components:

* **lune** - two triangles on opposite ends of a square
* **spheno-** - two adjacent lunes that make a wedge
* **hebespheno-** - two lunes separated by a third lune
* **-corona** - a crownlike complex of eight triangles
* **-megacorona** - a crownlike complex of 12 triangles
* **-cingulum** - a belt of 12 triangles

While they are not directly composed of other polyhedra, these solids may still be have interesting relationships with other solids. For example, the bilunabirotunda makes a [honeycomb] with the cube and dodecahedron.

[honeycomb]: https://en.wikipedia.org/wiki/Regular_dodecahedron#Space_filling_with_cube_and_bilunabirotunda
`

export const more = `
The polyhedra represented above are just a small subset of the wondrous world of geometric shapes and figures. For instance, the [Kepler-Poinsot polyhedra] are regular like the Platonic solids but non-convex, while the [Catalan solids] are the duals of the Archimedean solids and have non-regular faces. Beyond three dimensions, one can explore four dimensional shapes like the [tesseract] or the [grand antiprism].

[Kepler-Poinsot polyhedra]: https://en.wikipedia.org/wiki/Kepler%E2%80%93Poinsot_polyhedron
[Catalan solids]: https://en.wikipedia.org/wiki/Catalan_solid
[tesseract]: https://en.wikipedia.org/wiki/Tesseract
[grand antiprism]: https://en.wikipedia.org/wiki/Grand_antiprism

If you would like to learn more about polyhedra and other geometric figures, check out these links:

* [Virtual Polyhedra] by George W. Hart - an extensive encyclopedia of polyhedra and the major inspiration for this site
* [Visual Polyhedra] by David I. McCooey - More polyhedral models with extensive geometric data
* [polyHédronisme] by Anselm Levskaya - Build complex polyhedra using Conway operations
* [Polyhedra] by Stacy Speyer - Paper models of polyhedra and other artistic imaginings
* [Johnson Solids] by Allison Chen - Diagrams categorizing the Johnson solids based on their operations

[Virtual Polyhedra]: http://www.georgehart.com/virtual-polyhedra/vp.html
[Visual Polyhedra]: http://dmccooey.com/polyhedra/
[polyHédronisme]: http://levskaya.github.io/polyhedronisme/
[Polyhedra]: http://polyhedra.stacyspeyer.net/
[Johnson Solids]: http://portfolios.risd.edu/gallery/Johnson-Solids/8807383
`

export const footer = `
Copyright © 2018-2020 Nat Alison

If you enjoyed this and would like to see more, please consider buying me a [Ko-fi].

Inspiration and geometric data taken from [Virtual Polyhedra] by George W. Hart.

Thank you to the countless friends and unsuspecting strangers who helped test this site and provided their feedback.

Made with [react-three-fiber].

Source on [GitHub].

[Ko-fi]: https://ko-fi.com/tesseralis/
[Virtual Polyhedra]: http://www.georgehart.com/virtual-polyhedra/vp.html
[React]: https://reactjs.org/
[react-three-fiber]: https://github.com/react-spring/react-three-fiber/
[GitHub]: https://www.github.com/tesseralis/polyhedra-viewer
`
