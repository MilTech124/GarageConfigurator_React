// Import the EmailJS library
import emailjs from '@emailjs/browser';
// Define your EmailJS service ID, template ID, and user ID
import { toast } from 'react-toastify';

// Define a function to send an email with EmailJS
function SendEmail(data,idTemplate) {
    // Define the email parameters
    const templateParams = data;
    const serviceID = import.meta.env.VITE_PUBLIC_SERVICE_ID;
    const templateID =idTemplate ? idTemplate :import.meta.env.VITE_PUBLIC_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_PUBLIC_PUBLIC_KEY;  

    toast.info('Wysyłanie wiadomości', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,     
        });
    // Send the email using EmailJS
    emailjs.send(serviceID, templateID, templateParams, publicKey)
        .then((response) => {
            toast.done('Wysłano wiadomość', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,     
                });
            console.log('SUCCESS!', response.status, response.text);

            setTimeout(() => {
                window.location.href = '/';
             }, 5000);        
            
        }, (error) => {
            console.log('FAILED...', error);
        });
}

// Export the sendEmail function
export default SendEmail;
