"use client";

import * as z from "zod";
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWrapper } from "./card-wrapper";
import { NewPasswordSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { useSearchParams } from "next/navigation";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import Link from "next/link";
import { reset } from "@/actions/reset";


export const NewPasswordForm = () => {

    const searchparams = useSearchParams();

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
   
    const form = useForm<z.infer<typeof NewPasswordSchema>>({
        resolver: zodResolver(NewPasswordSchema),
        defaultValues: {
            password: "",
        },
    })

    const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
        setError("");
        setSuccess("");
        console.log("NEW PASSWORD ", values);
               
        startTransition(() => {
            reset(values)
           .then ((data) => {
            if (data?.error) {
               form.reset(); 
               setError(data.error);
            }

            if (data?.success) {
                form.reset();   
             setSuccess(data.success);
            } 
        }) 
         .catch(() => setError("Quelque chose s'est mal passé !"))  
        }); 
    }

    return (
        <div className="fixed inset-0  bg-gray-500 flex items-center justify-center p-4">
        <CardWrapper
            labelBox= "Reinitialiser Mot de Passe"
            headerLabel="Entrer votre nouveau Mot de Passe"
            backButtonLabel="Retour à la connexion"
            backButtonHref="/login"
        >
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit)}
                    className=" border-0  space-y-6"
                >
                   <div className="space-y-">
                   
                        <FormField
                               control={form.control}
                               name="password"
                               render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mot de passe</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field}
                                                // disabled={isPending}
                                                placeholder="******"
                                                type="password"
                                            />
                                        </FormControl>
                                        <Button
                                            size="sm"
                                            variant="link"
                                            asChild
                                            className="px-0 font-normal"
                                        >
                                            <Link href="/reset">
                                                Mot de passe oublié ?
                                            </Link>
                                        </Button>
                                    </FormItem>
                                )}   
                            />
                      
                   </div> 

                        <FormError message={error}/>
                        <FormSuccess message={success}/>
                        <Button
                            disabled={isPending}
                            type="submit"
                            className="w-full bg-black text-white rounded-xl"
                        >
                             Reintialiser le mlot de passe   
                        </Button>

                </form>
            </Form>
        </CardWrapper>
        </div>
    )
}

