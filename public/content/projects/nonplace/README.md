**nonplace**

A javascript program that generates plausible maps using a simple implementation of the marching sqaures algorithm.

**Technical Details**  
The input field for the marching squares is a fractal noise grid constructed from a 2D simplex noise (using [this](https://github.com/blindman67/SimplexNoiseJS) js library). The fractal noise function takes `scale`, `octaves`, and `persistence` as its parameters. `Scale` affects the size of the noise features, and lowering it usually results in more intricate contour lines. However, instead of directly drawing the land masses, my implementation draws the negative spaces because I wanted random textures for the background (there might be more efficient ways to do this... ), so the effect of `scale` is inverted. For both `persistence` and `octaves`, a higher value produces more detailed contours, and a lower value results in smoother lines. There is another parameter `threshold`, which is used for the marching squares algorithm. `Threshold` determines which cells in the input noise grid are included in the binary map, and a higher value normally results in more details. But in my implementation, the effect of `threshold` is inverted just like with `scale` since the contours are "drawn" as negative spaces.

Play around with the parameters and make your own maps [here](https://nonplace.vercel.app/) 🗺️
