import {  useState } from 'react'

function Modal() {
    const [modal, setModal] = useState(true)
  return (
    modal ?  <div className="w-screen h-screen bg-black bg-opacity-50 fixed z-50 top-0 left-0 flex justify-center items-center">
        <div className="bg-slate-800  p-5 max-w-2xl">
          <h1>Konfigurator 3D AcelGarage</h1>
          <p className='py-2'>Korzystanie z niego jest możliwe wyłącznie zgodnie z poniższymi zasadami.</p>
       
          <ul className='flex flex-col text-xs gap-2'>
            <li>1. Konfigurator 3D firmy AcelGarage jest przeznaczony wyłącznie do użytku wewnętrznego przez klientów firmy AcelGarage. Jest zabronione korzystanie z konfiguratora przez osoby trzecie, w tym <strong>inne firmy</strong>, w celu wizualizacji, kopiowania lub jakiejkolwiek innej formy użytkowania.</li>
            <li>2. Kopiowanie, reprodukowanie lub modyfikowanie kodu konfiguratora 3D jest surowo zabronione oraz objęte prawami autorskimi.</li>
            <li>3. Wszelkie dane wprowadzone do konfiguratora 3D, w tym projekty, modele, grafiki, są własnością firmy AcelGarage i nie mogą być używane ani udostępniane osobom trzecim bez zgody firmy.</li>
            <li>4. Firma AcelGarage zastrzega sobie prawo do zmiany zasad korzystania z konfiguratora 3D w dowolnym momencie bez wcześniejszego powiadomienia.</li>
            <li>5. Firma AcelGarage zastrzega sobie prawo do <strong>wszelkich działań prawnych w przypadku naruszenia powyższych zasad.</strong></li>
          </ul>
          <p className='pt-2 text-red-500 text-sm'>Korzystając z konfiguratora 3D firmy AcelGarage, użytkownik akceptuje powyższe zasady oraz zobowiązuje się do ich przestrzegania. Niezastosowanie się do tych zasad może skutkować podjęciem odpowiednich działań prawnych przez firmę AcelGarage.</p>
          <div className='flex justify-evenly pt-2'>
            <button className='btn-acel ' onClick={() => setModal(false)}>Akceptuję</button>
            <button className='btn-acel' onClick={() => window.location.href = 'https://acelgarage.pl'}>Odrzucam</button>
          </div>

          <p className='pt-5 text-xs'>Realizacja <a className='text-green-500 hover:font-bold' href="https://www.mil-tech.pl/">Mil-TECH</a></p>
         

        </div>
      </div>
     : null
      
   
  )
}

export default Modal