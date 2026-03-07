"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
// Server action import
import { chatWithGemini, type Message } from "@/actions/ai"
import { toast } from "sonner"

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg = input
        setInput("")

        // Add user message to UI immediately
        const newHistory = [...messages, { role: "user" as const, parts: userMsg }]
        setMessages(newHistory)
        setIsLoading(true)

        try {
            const result = await chatWithGemini(messages, userMsg)

            if (result.success) {
                setMessages(prev => [...prev, { role: "model", parts: result.message! }])
            } else {
                toast.error(result.message)
                // Remove last user message if failed? Or just show error system msg
                setMessages(prev => [...prev, { role: "model", parts: "Üzgünüm, bir hata oluştu: " + result.message }])
            }
        } catch (err) {
            toast.error("İletişim hatası")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b bg-primary text-primary-foreground flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <span className="font-semibold">İK Asistanı</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto scroll-smooth" ref={scrollRef}>
                        <div className="flex flex-col gap-4">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm py-8 space-y-2">
                                    <Bot className="h-8 w-8 mx-auto opacity-50" />
                                    <p>Merhaba! Personeller, izinler veya şubeler hakkında bana soru sorabilirsin.</p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={cn(
                                    "flex gap-2 max-w-[85%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-orange-500" />}
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm",
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none"
                                    )}>
                                        {msg.parts}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-2 mr-auto max-w-[85%]">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
                                    </div>
                                    <div className="bg-muted p-3 rounded-2xl rounded-tl-none w-16 flex items-center justify-center">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t bg-muted/20">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Bir soru sor..."
                                className="flex-1 bg-background"
                                autoFocus
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105",
                    isOpen ? "rotate-90 scale-0 opacity-0 hidden" : "scale-100 opacity-100"
                )}
            >
                <Sparkles className="h-6 w-6" />
            </Button>
        </div>
    )
}
