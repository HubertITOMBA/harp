"use client"

import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import { Header } from "@/components/auth/header";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
    labelBox: string;
    children: React.ReactNode;
    headerLabel: string;
    backButtonLabel: string;
    backButtonHref: string;
};

export const CardWrapper = ({ 
    labelBox,
    children,
    headerLabel,
    backButtonLabel,
    backButtonHref,
}: CardWrapperProps) => {

    return(
        
        <Card className="w-[400px]  bg-white shadow-xl">
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