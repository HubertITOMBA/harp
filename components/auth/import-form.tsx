"use client";

import * as z from "zod";
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardWrapper } from "./card-wrapper";
import { HarpserSchema, RegisterSchema } from "@/schemas";
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
import { importer } from "@/actions/importharp";


export const ImporterForm = () => {

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
   
    const form = useForm<z.infer<typeof HarpserSchema>>({
        resolver: zodResolver(HarpserSchema),
        defaultValues: {
             srv    : "",
                ip     : "",
                pshome : "",
                os     : "",
                psuser : "",
                domain : "",
                env    : "",
                typsrv : "",
                status: 0,
        },
    })

    const onSubmit = (values: z.infer<typeof HarpserSchema>) => {
        setError("");
        setSuccess("");
        
        startTransition(() => {
            importer(values)
           .then ((data) => {
                setError(data.error);
                setSuccess(data.success);
             });   
        }); 
    };

    return (
       <div>
       <Form {...form}>

             <form 
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                <FormError message={error}/>
                <FormSuccess message={success}/>
            <Button
                        // disabled={isPending}
                        type="submit"
                        className="w-full"
                    >
            IMPORTER 
        </Button>

            </form>

       </Form>

       
       </div>
    )
}

