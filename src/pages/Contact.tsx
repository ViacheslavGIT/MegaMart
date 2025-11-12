import { useEffect } from "react"
import "./Contact.css"

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function Contact() {
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        window.initMap()
        return
      }

      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      )
      if (existingScript) return

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDLzmE1Mi_HHqFyuTI9JQ97B4IGmHamh90&callback=initMap&loading=async&libraries=marker`
      script.async = true
      document.body.appendChild(script)
    }

    window.initMap = () => {
      const map = new window.google.maps.Map(document.getElementById("map"), {
        center: { lat: 48.5, lng: 31.0 },
        zoom: 6.2,
        mapId: "4fada26ab53ab040c9d77dc2",
        disableDefaultUI: true,
      })

      const { AdvancedMarkerElement } = window.google.maps.marker

      const locations = [
        { name: "Kyiv Store", position: { lat: 50.4501, lng: 30.5234 } },
        { name: "Kharkiv Store", position: { lat: 49.9935, lng: 36.2304 } },
        { name: "Odesa Store", position: { lat: 46.4825, lng: 30.7233 } },
      ]

      locations.forEach((loc) => {
        const marker = new AdvancedMarkerElement({
          position: loc.position,
          map,
          title: loc.name,
        })

        const info = new window.google.maps.InfoWindow({
          content: `<div style="font-weight:600; font-family:Montserrat, sans-serif; color:#111">${loc.name}</div>`,
        })

        marker.addListener("click", () => info.open(map, marker))
      })
    }

    loadGoogleMaps()
  }, [])

  return (
    <div className="contact-wrapper">
      <div className="contact-page">
        <h1 className="contact-title">Our Stores in Ukraine</h1>
        <p className="contact-subtitle">
          We’re happy to help you! Contact any of our branches below.
        </p>

        <div className="contact-content">
          <div className="contact-grid">
            <div className="contact-card">
              <h2>Kyiv Store</h2>
              <p><b>Email:</b> kyiv@megamart.ua</p>
              <p><b>Phone:</b> +380 (44) 123 45 67</p>
              <p><b>Address:</b> 12 Khreshchatyk St, Kyiv</p>
            </div>

            <div className="contact-card">
              <h2>Kharkiv Store</h2>
              <p><b>Email:</b> kharkiv@megamart.ua</p>
              <p><b>Phone:</b> +380 (57) 234 56 78</p>
              <p><b>Address:</b> 25 Sumska St, Kharkiv</p>
            </div>

            <div className="contact-card">
              <h2>Odesa Store</h2>
              <p><b>Email:</b> odesa@megamart.ua</p>
              <p><b>Phone:</b> +380 (48) 345 67 89</p>
              <p><b>Address:</b> 8 Deribasivska St, Odesa</p>
            </div>
          </div>

          <div className="map-wrapper">
            <h2 className="map-title">Find us on the map</h2>
            <div id="map" className="map-container"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
