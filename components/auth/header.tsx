import { Poppins } from "next/font/google";

import { cn } from "@/lib/utils"
import Image from "next/image";

const font = Poppins({
    subsets: ["latin"],
    weight: ["600"],
})


interface HeaderProps {
    label: string;
};


export const Header = ({label,}: HeaderProps) => {

    return (
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
            <Image className="h-auto w-auto mb-5 object-cover" src="/images/OPSE_logo.gif"  priority width={250} height={50} alt="logo" /> 
            <h1 className={cn("text-3xl text-red-900 font-semibold", font.className)}>
              🔐 TMA HARP
            </h1>
            <p className="text-muted-foreground text-sm">
                {label}
            </p>
        </div>
    )

}