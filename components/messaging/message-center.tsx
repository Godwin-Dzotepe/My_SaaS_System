'use client';







import React from 'react';



import type { Role } from '@prisma/client';



import { Sidebar } from '@/components/dashboard/sidebar';



import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';



import { Button } from '@/components/ui/button';



import { Input } from '@/components/ui/input';



import { Badge } from '@/components/ui/badge';



import { MessageSquare, Pencil, Send, Trash2, Loader2 } from 'lucide-react';



import { getAllowedRecipientRoles } from '@/lib/message-permissions';







type RecipientRole = 'school_admin' | 'teacher' | 'parent' | 'secretary' | 'finance_admin';







interface MessageItem {



  id: string;



  title: string;



  body: string;



  sender_id: string;



  sender_name: string;



  sender_role: string;



  recipient_id: string;



  recipient_name: string;



  recipient_role: string;



  school_name: string;



  is_edited: boolean;



  edited_at: string | null;



  created_at: string;



  updated_at: string;



  direction: 'sent' | 'received';



}







interface MessageCenterProps {



  heading: string;



  subheading: string;



  currentRole: string;



  userName: string;



  sidebarItems: any[];



  recipientOptions: Array<{ value: RecipientRole; label: string }>;



}







export function MessageCenter({



  heading,



  subheading,



  currentRole,



  userName,



  sidebarItems,



  recipientOptions,



}: MessageCenterProps) {



  const [messages, setMessages] = React.useState<MessageItem[]>([]);



  const [loading, setLoading] = React.useState(true);



  const [saving, setSaving] = React.useState(false);



  const [error, setError] = React.useState('');



  const [viewerRole, setViewerRole] = React.useState<Role | null>((currentRole as Role) || null);



  const [title, setTitle] = React.useState('');



  const [body, setBody] = React.useState('');



  const [editingId, setEditingId] = React.useState<string | null>(null);



  const [deliveryMode, setDeliveryMode] = React.useState("system");







  const allowedRecipientOptions = React.useMemo(() => {



    if (!viewerRole) {



      return recipientOptions;



    }







    const allowedRoles = new Set(getAllowedRecipientRoles(viewerRole));



    return recipientOptions.filter((option) => allowedRoles.has(option.value));



  }, [recipientOptions, viewerRole]);







  const defaultRecipientRole = allowedRecipientOptions[0]?.value || 'school_admin';



  const [recipientRole, setRecipientRole] = React.useState<RecipientRole>(defaultRecipientRole);







  const fetchMessages = React.useCallback(async () => {



    try {



      setLoading(true);



      setError('');



      const response = await fetch('/api/messages', { cache: 'no-store' });



      const data = await response.json().catch(() => null);



      if (!response.ok) {



        throw new Error(data?.error || 'Failed to fetch messages.');



      }



      setMessages(Array.isArray(data?.messages) ? data.messages : []);



    } catch (fetchError) {



      console.error(fetchError);



      setMessages([]);



      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch messages.');



    } finally {



      setLoading(false);



    }



  }, []);







  React.useEffect(() => {



    fetchMessages();



  }, [fetchMessages]);







  React.useEffect(() => {



    fetch('/api/auth/me', { cache: 'no-store' })



      .then((response) => response.json())



      .then((data) => {



        if (data?.user?.role) {



          setViewerRole(data.user.role as Role);



        }



      })



      .catch(console.error);



  }, []);







  React.useEffect(() => {



    if (!allowedRecipientOptions.some((option) => option.value === recipientRole)) {



      setRecipientRole(defaultRecipientRole);



    }



  }, [allowedRecipientOptions, defaultRecipientRole, recipientRole]);







  const resetComposer = () => {



    setTitle('');



    setBody('');



    setEditingId(null);



    setRecipientRole(defaultRecipientRole);



    setDeliveryMode("system");



  };







  const handleSubmit = async () => {



    if (!title.trim() || !body.trim()) {



      setError('Title and message are required.');



      return;



    }







    try {



      setSaving(true);



      setError('');







      const response = await fetch(editingId ? `/api/messages/${editingId}` : '/api/messages', {



        method: editingId ? 'PATCH' : 'POST',



        headers: {



          'Content-Type': 'application/json',



        },



        body: JSON.stringify({



          title,



          body,



          recipient_role: recipientRole,



          delivery_mode: deliveryMode,



        }),



      });







      const data = await response.json().catch(() => null);



      if (!response.ok) {



        throw new Error(data?.error || 'Failed to save message.');



      }







      await fetchMessages();



      resetComposer();



    } catch (submitError) {



      console.error(submitError);



      setError(submitError instanceof Error ? submitError.message : 'Failed to save message.');



    } finally {



      setSaving(false);



    }



  };







  const handleEdit = (message: MessageItem) => {



    setEditingId(message.id);



    setTitle(message.title);



    setBody(message.body);



    setRecipientRole(message.recipient_role as RecipientRole);



  };







  const handleDelete = async (messageId: string) => {



    try {



      setError('');



      const response = await fetch(`/api/messages/${messageId}`, {



        method: 'DELETE',



      });



      const data = await response.json().catch(() => null);



      if (!response.ok) {



        throw new Error(data?.error || 'Failed to delete message.');



      }



      await fetchMessages();



      if (editingId === messageId) {



        resetComposer();



      }



    } catch (deleteError) {



      console.error(deleteError);



      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete message.');



    }



  };







  return (



    <div className="flex min-h-screen bg-gray-50">



      <Sidebar items={sidebarItems} userRole={currentRole} userName={userName} />



      <div className="flex-1 p-4 lg:ml-64 lg:p-8">



        <div className="mx-auto max-w-7xl space-y-6">



          <div>



            <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>



            <p className="text-gray-600">{subheading}</p>



          </div>







          {error ? (



            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>



          ) : null}







          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">



            <Card>



              <CardHeader>



                <CardTitle>{editingId ? 'Edit Message' : 'Compose Message'}</CardTitle>



              </CardHeader>



              <CardContent className="space-y-4">



                {allowedRecipientOptions.length > 1 ? (



                  <div>



                    <label className="mb-1 block text-sm font-medium text-gray-700">Send To</label>



                    <select



                      className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"



                      value={recipientRole}



                      onChange={(e) => setRecipientRole(e.target.value as RecipientRole)}



                      disabled={Boolean(editingId)}



                    >



                      {allowedRecipientOptions.map((option) => (



                        <option key={option.value} value={option.value}>



                          {option.label}



                        </option>



                      ))}



                    </select>



                  </div>



                ) : null}







                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Delivery</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value)}
                    disabled={Boolean(editingId)}
                  >
                    <option value="system">System Only</option>
                    <option value="sms">SMS + System</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    System Only sends in-app message. SMS + System sends SMS and also keeps the message in system.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Message title" />



                </div>







                <div>



                  <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>



                  <textarea



                    className="min-h-[180px] w-full rounded-lg border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-500"



                    value={body}



                    onChange={(e) => setBody(e.target.value)}



                    placeholder="Write your message..."



                  />



                </div>







                {body ? (



                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">



                    <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>



                    <p className="font-semibold text-gray-900">
                      {currentRole === "school_admin"
                        ? recipientRole === "parent"
                          ? "Message to all parents"
                          : recipientRole === "teacher"
                            ? "Message to all teachers"
                            : recipientRole === "secretary"
                              ? "Message to all secretaries"
                              : recipientRole === "finance_admin"
                                ? "Message to all finance admins"
                                : "Message to all school admins"
                        : title ? title : "Untitled message"}
                    </p>



                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{body}</p>



                  </div>



                ) : null}







                <div className="flex gap-2">



                  <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-2">



                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}



                    {editingId ? 'Update Message' : 'Send Message'}



                  </Button>



                  {editingId ? (



                    <Button variant="outline" onClick={resetComposer}>



                      Cancel



                    </Button>



                  ) : null}



                </div>



              </CardContent>



            </Card>







            <Card>



              <CardHeader>



                <CardTitle>Messages</CardTitle>



              </CardHeader>



              <CardContent>



                {loading ? (



                  <div className="flex justify-center py-12">



                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />



                  </div>



                ) : messages.length === 0 ? (



                  <div className="py-16 text-center text-gray-500">No messages yet.</div>



                ) : (



                  <div className="space-y-4">



                    {messages.map((message) => (



                      <div key={message.id} className="rounded-xl border border-gray-200 p-4">



                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">



                          <div className="space-y-2">



                            <div className="flex flex-wrap items-center gap-2">



                              <Badge variant={message.direction === 'sent' ? 'default' : 'secondary'}>



                                {message.direction === 'sent' ? 'Sent' : 'Received'}



                              </Badge>



                              <Badge variant="secondary">{message.school_name}</Badge>



                              {message.is_edited ? <Badge variant="outline">Edited</Badge> : null}



                            </div>



                            <h3 className="text-lg font-semibold text-gray-900">{message.title}</h3>



                            <p className="text-sm text-gray-500">



                              {message.direction === 'sent'



                                ? `To ${message.recipient_name} (${message.recipient_role.replace('_', ' ')})`



                                : `From ${message.sender_name} (${message.sender_role.replace('_', ' ')})`}



                            </p>



                            <p className="whitespace-pre-wrap text-sm text-gray-700">{message.body}</p>



                            <p className="text-xs text-gray-400">{new Date(message.created_at).toLocaleString()}</p>



                          </div>







                          {message.direction === 'sent' ? (



                            <div className="flex gap-2">



                              <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleEdit(message)}>



                                <Pencil className="h-4 w-4" />



                                Edit



                              </Button>



                              <Button variant="ghost" size="sm" className="gap-2 text-rose-600 hover:text-rose-700" onClick={() => handleDelete(message.id)}>



                                <Trash2 className="h-4 w-4" />



                                Delete



                              </Button>



                            </div>



                          ) : (



                            <div className="rounded-full bg-blue-50 p-3 text-blue-600">



                              <MessageSquare className="h-5 w-5" />



                            </div>



                          )}



                        </div>



                      </div>



                    ))}



                  </div>



                )}



              </CardContent>



            </Card>



          </div>



        </div>



      </div>



    </div>



  );



}



