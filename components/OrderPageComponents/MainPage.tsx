import { useRouter } from "next/navigation"
import {MapPin, MoreHorizontal} from "lucide-react"
import { truncate } from "@/lib/utils/truncate"


export default function MainPage() {
    const router = useRouter()

    // this is a mockup replace this later, import the mockup json

    const mockupHash = "$2y$12$V.Ue5S3aYjQ2/9N/5T9.M.V8p/8f8H8/1CqK9jWz0J9jW2L0H9rO6"
    const sampleHash = truncate(mockupHash, 6)




    return (


    <div className="w-full h-full">
            {/* display the list of transaction history in here of ming and all in here and clicking things pop up a sideBar on  */}
            {/* the right */}

            <div className="px-5 py-5">
                <p className="tracking-widest font-extrabold"> Transaction History</p>
                <div className=" flex flex-col px-5">
                    {/* this is the outer loop but ill create only one example in here */}
                    <p className="my-2 font-semibold ">
                        Today
                    </p>
                    <div className="border rounded-2xl shadow-md cursor-pointer  shadow-green-200 w-full flex py-5 px-3 flex-row  h-20">
                        <div className="w-1/6 px-5 flex flex-col    ">
                            {/* this is the title */}
                            <p className="text-md font-bold tracking-wide"> Albay Farm</p>
                            <div className="flex flex-row">
                            <MapPin className="mt-1" color="#000" size={15} />
                            <p className="font-xs font-light">Albay-Bicol</p>
                            </div>
                        </div>


                        <div  className="w-2/3 h-full   mx-[5%] flex  flex-row gap-x-2    " >
                                {/* transaction hash */}
                            <div className="flex w-1/2 h-full flex-col text-center">
                            <p className="text-xs font-semibold ">
                                Transaction Hash
                            </p>

                            <p className="font-xs ">
                                    {sampleHash}
                            </p>

                            </div>
                            <div className="flex w-1/2 flex-col h-full text-center">
                                <p className="font-semibold text-xs">
                                Amount
                                </p>
                                <p className="font-light font-sm">
                                    $1000
                                </p>


                            </div>


                        </div>

                        <div className="w-1/6  h-full flex justify-end">
                            {/* this is the button more */}
                            <button className="flex justify-end px-5">
                                <MoreHorizontal color="#000" className="outline-none" size={24} />
                            </button>

                        </div>

                    </div>
                </div>


            </div>


    </div>
    )



}
