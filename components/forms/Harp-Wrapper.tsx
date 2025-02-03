"use client"

import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import { Header } from "@/components/auth/header";
import { BackButton } from "@/components/auth/back-button";

interface HarpWrapperProps {
    labelBox: string;
    children: React.ReactNode;
    headerLabel: string;
    backButtonLabel: string;
    backButtonHref: string;
};

export const HarpWrapper = ({ 
    labelBox,
    children,
    headerLabel,
    backButtonLabel,
    backButtonHref,
}: HarpWrapperProps) => {

    return(
        <Card className="w-[700px]  bg-white shadow-xl">
            <CardHeader>
                <Header  label={headerLabel}/>
            </CardHeader>
            <CardContent>
            { children}
            </CardContent>
            <CardFooter>
                <BackButton
                    label={backButtonLabel}
                    href={backButtonHref}
                />
            </CardFooter> 
        </Card>
    )

}