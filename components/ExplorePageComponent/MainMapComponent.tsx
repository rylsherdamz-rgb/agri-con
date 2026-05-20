import ParcelMap from "../ParcelMap"


export default function MainMapComponent() {
    return (
    <div className="w-full h-full">

            {/* this is divided in half this is the map */}
            <div className="w-2/3 h-full">
                {/* main map component */}
                <ParcelMap />
            </div>

            <div className="w-1/3 h-full">


            </div>

    </div>
    )
}
