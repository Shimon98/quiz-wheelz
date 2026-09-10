const FULL_ACROSS = Object.freeze({ start: 0, end: 1 });

export function buildProjectedStripMeshData({
  rows,
  columns,
  edgesAt,
  alongAt,
  alongIsU,
  acrossAt = () => FULL_ACROSS,
}) {
  const vertexColumns = columns + 1;
  const vertexCount = (rows + 1) * vertexColumns;
  const positions = new Float32Array(vertexCount * 2);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint32Array(rows * columns * 6);
  const baseAlong = new Float32Array(rows + 1);

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const { startX, startY, endX, endY } = edgesAt(t);
    const { start: acrossStart, end: acrossEnd } = acrossAt(t);
    const along = alongAt(t);
    baseAlong[row] = along;

    for (let column = 0; column < vertexColumns; column += 1) {
      const across = column / columns;
      const acrossUv = acrossStart + (acrossEnd - acrossStart) * across;
      const vertex = (row * vertexColumns + column) * 2;
      positions[vertex] = startX + (endX - startX) * across;
      positions[vertex + 1] = startY + (endY - startY) * across;
      uvs[vertex] = alongIsU ? along : acrossUv;
      uvs[vertex + 1] = alongIsU ? acrossUv : along;
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * vertexColumns + column;
      const bottomLeft = topLeft + vertexColumns;
      const base = (row * columns + column) * 6;
      indices[base] = topLeft;
      indices[base + 1] = topLeft + 1;
      indices[base + 2] = bottomLeft;
      indices[base + 3] = topLeft + 1;
      indices[base + 4] = bottomLeft + 1;
      indices[base + 5] = bottomLeft;
    }
  }

  return { positions, uvs, indices, baseAlong, vertexColumns, alongIsU };
}

export function writeStripPhase(
  uvData,
  { baseAlong, vertexColumns, alongIsU },
  phase,
  direction = 1,
) {
  const component = alongIsU ? 0 : 1;
  for (let row = 0; row < baseAlong.length; row += 1) {
    const along = phase + direction * baseAlong[row];
    for (let column = 0; column < vertexColumns; column += 1) {
      uvData[(row * vertexColumns + column) * 2 + component] = along;
    }
  }
}
