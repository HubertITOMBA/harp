"use client";

import * as z from "zod";
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWrapper } from "./card-wrapper";
import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/actions/login";
import { useSearchParams } from "next/navigation";

type LoginFormProps = { callbackUrl?: string | null };

export const LoginForm = ({ callbackUrl: callbackUrlProp }: LoginFormProps = {}) => {
    const searchParams = useSearchParams();
    const callbackUrl = callbackUrlProp ?? searchParams.get("callbackUrl") ?? undefined;

    const router = useRouter();
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
   
    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            netid: "",
            email: "",
            password: "",
        },
    })

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        setSuccess("");
        
        startTransition(async () => {
           try {
            const data = await login(values, callbackUrl);
            
            if (data?.error) {
               form.reset(); 
               setError(data.error);
            }

            if (data?.success && data?.redirectTo) {
                form.reset();   
                setSuccess("Connexion réussie !");
                // Rediriger après un court délai pour permettre l'affichage du message
                setTimeout(() => {
                    router.push(data.redirectTo);
                    router.refresh();
                }, 500);
            } 
        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
            setError("Une erreur est survenue lors de la connexion. Veuillez réessayer.");
        }  
        }); 
    }

    return (
        <div className="fixed inset-0  bg-gray-500 flex items-center justify-center p-4">
        <CardWrapper
            labelBox= "Connexion"
            headerLabel="Content de vous revoir !"
            backButtonLabel="Vous n'avez pas encore de compte ?"
            backButtonHref="/register"
        >
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit)}
                    className=" border-0  space-y-6"
                >
                   <div className="space-y-">
                     <FormField 
                             control={form.control}
                             name="netid"
                             render={({ field }) => (
                             <FormItem>
                                 <FormLabel className="block text-sm font-semibold text-gray-700 mb-1">NetID</FormLabel>
                                 <FormControl className="rounded-md">
                                 <Input
                                     {...field}
                                     disabled={isPending}
                                    // className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    //  placeholder="Entrer le netId exemple => hitomba"
                                 />
                                 </FormControl>
                                 <FormMessage />
                             </FormItem>
                             )}
                        />
                         {/* <FormField 
                             control={form.control}
                             name="email"
                             render={({ field }) => (
                             <FormItem>
                                 <FormLabel>Email adresse</FormLabel>
                                 <FormControl>
                                 <Input
                                     {...field}
                                    //  disabled={isPending}
                                     placeholder=""
                                     type="email"
                                 />
                                 </FormControl>
                                 <FormMessage />
                             </FormItem>
                             )}
                        /> */}
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
                                                placeholder=""
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
                            className="w-full bg-primary"
                        >
                             Connexion   
                        </Button>

                </form>
            </Form>
        </CardWrapper>
        </div>
    )
}

