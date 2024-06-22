import { useState } from "react";
import { usePathname } from 'next/navigation'
import { PaperAirplaneIcon,PhoneIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import SendEmail from "./SendMail";

function Order({ show, setShow}) {
  const pathname = usePathname()


  console.log(pathname);

  const [dataForm, setDataForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    link: "www.acelgarage.pl"+pathname ,
  })

  const handleChange = (e) => {
    setDataForm({
      ...dataForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if(dataForm.name !== "" && dataForm.email !== "" && dataForm.phone !== ""){
    SendEmail(dataForm)
    setShow(false)
    }else{
      alert("Uzupełnij wszystkie pola")
    }
  }


  return (
    <>
      {show ? (
        <div className="w-screen h-screen fixed top-0 left-0 bg-black/50 flex justify-center items-center z-50">
          <div className="md:w-1/2 p-10  w-[90%]  bg-white/80 flex flex-col rounded-md justify-center items-center text-black">
            <h4 className="text-black pb-5 max-sm:text-base">
              Zamówienia można składać mailowo lub telefonicznie. Wszystkie
              informacje na temat garażu zostaną przekazane po wysłaniu
              formularza.
            </h4>
            <form className="flex w-full flex-col gap-2">
              <label htmlFor="name">Imię i Nazwisko</label>
              <input
                type="text"
                name="name"
                id="name"
                className="border-2 p-2 border-gray-300 rounded-md"
                onChange={handleChange}
                required
              />
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                className="border-2 p-2 border-gray-300 rounded-md"
                onChange={handleChange}
                required
              />
              <label htmlFor="phone">Telefon</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                className="border-2 p-2 border-gray-300 rounded-md"
                onChange={handleChange}
                required
              />
              <label htmlFor="message">Dodatkowa Wiadomość</label>
              <textarea
                name="message"
                id="message"
                className="border-2 p-2 border-gray-300 rounded-md"
                onChange={handleChange}
              ></textarea>
              <div className="flex justify-center gap-5">
               <button onClick={handleSubmit} className="btn-acel bg-black/20 flex items-center"><PaperAirplaneIcon className="w-10 h-10"/>Wyślij</button>
               <Link href="tel:+48 733003192"><button onClick={()=>setShow(false)} className="btn-acel bg-black/20 flex items-center"><PhoneIcon className="w-10 h-10"/>Zadzwoń</button></Link>
               <button onClick={()=>setShow(false)} className="btn-acel bg-black/20 flex items-center">Anuluj</button>
              </div>
           
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Order;
