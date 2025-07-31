import { toast } from 'react-toastify';

// Funkcja do wysyłania emaila przez WordPress API
function SendEmailWP(data, templateType = 'default') {
    const wpApiUrl = 'https://newgarage.pl/wp-json/newgarage/v1/send-email';
    
    toast.info('Wysyłanie wiadomości', {       
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,     
    });

    // Przygotowanie danych do wysłania
    const emailData = {
        template_type: templateType,
        contact: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            wojewodztwo: data.wojewodztwo,
            address: data.address,
            message: data.message || ''
        },
        garage_config: {
            // Podstawowe parametry garażu
            width: data.data?.width,
            depth: data.data?.depth,
            height: data.data?.height,
            color: data.data?.color,
            emboss: data.data?.emboss,
            direction: data.data?.direction,
            
            // Dach
            roof: data.data?.roof,
            roofColor: data.data?.roofColor,
            roofType: data.data?.roofType,
            
            // Bramy
            gateCount: data.data?.gateCount,
            gateType1: data.data?.gateType1,
            gateColor1: data.data?.gateColor1,
            gateWidth1: data.data?.gateWidth1,
            gateHeight1: data.data?.gateHeight1,
            
            gateType2: data.data?.gateType2,
            gateColor2: data.data?.gateColor2,
            gateWidth2: data.data?.gateWidth2,
            gateHeight2: data.data?.gateHeight2,
            
            gateType3: data.data?.gateType3,
            gateColor3: data.data?.gateColor3,
            gateWidth3: data.data?.gateWidth3,
            gateHeight3: data.data?.gateHeight3,
            
            // Drzwi i okna
            doors: data.door || '',
            windows: data.window || '',
            doorCount: data.doorList || 0,
            windowCount: data.windowList || 0,
            
            // Carport
            carport: data.data?.carport,
            carportWidth: data.data?.carportWidth,
            carportSide: data.data?.carportSide,
            carportType: data.data?.carportType,
            carportSides: data.carportSides || '',
            carportSides2: data.carportSides2 || '',
            
            // Dodatki
            gutter: data.data?.gutter,
            automatic: data.data?.automatic,
            countAutomatic: data.data?.countAutomatic,
            filc: data.data?.filc,
            transport: data.data?.transport
        },
        price: data.price,
        imageURL: data.imageURL
    };

    // Wysłanie danych do WordPress
    fetch(wpApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            toast.success('Wysłano wiadomość', {                
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,     
            });
            console.log('SUCCESS!', result);

            // setTimeout(() => {
            //     window.location.href = 'https://newgarage.pl/';
            // }, 3000);
        } else {
            throw new Error(result.message || 'Błąd wysyłania');
        }
    })
    .catch(error => {
        console.error('FAILED...', error);
        toast.error('Błąd wysyłania wiadomości: ' + error.message, {
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
        });
    });
}

export default SendEmailWP;
