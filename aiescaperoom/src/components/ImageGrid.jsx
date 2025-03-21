import '../styles/ImageGrid.css'

const ImageGrid = ({ images }) => {
  // Group images by row to create a 3xN grid
  const groupedImages = {}
  images.forEach(image => {
    const row = image.position[0]
    if (!groupedImages[row]) {
      groupedImages[row] = []
    }
    groupedImages[row].push(image)
  })
  
  return (
    <div className="image-grid-container">
      {Object.keys(groupedImages).map(row => (
        <div className="image-row" key={row}>
          {groupedImages[row].map(image => (
            <div 
              className="image-cell"
              key={image.id}
              data-position={`${image.position[0]}-${image.position[1]}`}
            >
              <img src={image.url} alt={`Image ${image.id}`} />
              <div className="image-overlay">
                {image.position[0]},{image.position[1]}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ImageGrid
