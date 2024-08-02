import garagePrice from "./garagePrice.js";

function CalcMain({selectedOptions, price, setPrice}) {
    const SoloGaragePrice = garagePrice({selectedOptions});
    const {width,depth,roof,height,automatic,roofType,filc,door,window,carport,
        carportWidth,gutter,carportType,wojewodztwo,countAutomatic,gateType1,gateType2,gateType3, gateCount,
        carportSide} = selectedOptions;


    //helpers 

    const calcHeightPrice = () => {
        const standardHeight = 213;
        const heightPrice = 700;
       const heightPrize = height - standardHeight
         return heightPrize/10 * heightPrice
    }

    const calcCarportPrice = () => {
        let resault = 0       
        const StandardWith = 1
        const StandardPaidWith= 0.5
        const pricePerMeter = 500
        const typePrice = carportType ==="brak" ? 1000 : carportType=== "oblachowane" ?  2000 :(carportType=== "azury"||carportType==="mix") ?  2500 : null

        if(carport) {
            resault = (carportWidth-StandardWith)/StandardPaidWith* pricePerMeter +typePrice           
        }
        return resault
    }
    const calcGutterPrice = () => {
        let resault =0 
        const pricePerMeter = 100
        if(roof === "dwuspad" || roof === "dwuspad przod-tył") {
            if(carport&& (carportSide === "przód"||carportSide === "tył")) {
               return resault = (width+carportWidth)*2*pricePerMeter
            }
            resault = width*2*pricePerMeter
        }else {
            resault = width*pricePerMeter
            if(carport) {
                resault = (width+carportWidth)*pricePerMeter
            }
        }
        return resault
    }

    const transportPrice = (woj) =>{
        const price = 250
        if(woj === "dolnośląskie"  || woj === "lubelskie" || woj === "lubuskie" || woj === "łódzkie" || woj === "małopolskie" || woj === "mazowieckie" || woj === "opolskie" || woj === "podkarpackie" ||  woj === "śląskie" || woj === "świętokrzyskie"  || woj === "wielkopolskie" ) {
            return price
        }else if(woj === "kujawsko-pomorskie" || woj === "podlaskie" || woj === "pomorskie" || woj === "warmińsko-mazurskie" || woj === "zachodniopomorskie") {
            return price*2
        }
        else return null

    } 

    const gatePrice = () => {
        let resault = 0
        const gateType = [gateType1,gateType2,gateType3]    
    
        for(let i = 0; i<=gateCount; i++) {
    
            if(gateType[i] === "dwuskrzydłowa") {
                 resault -= 400  
            }
        }
        return resault
    }

    const filcPrice = () => {
        if(filc) {
            if(carport){
                return depth * (width+carportWidth)  * 25
            }
            return depth * width  * 25
        }else return 0
        
        
    }



    

   const calculatePrice = () => {
    const fullPrice =        
        SoloGaragePrice + 
        (roof === "spad tył" ? -500 : 0) +
        (calcHeightPrice())+
        gatePrice()+
        (automatic ? 1300*countAutomatic : 0)+
        (roofType === "blachodachówka" ? (depth*width*65) : 0)+
        filcPrice()+
        (door.length >= 0 ? (door.length*450) : 0)+
        (window.length >= 0 ? (window.length*450) : 0)+
        (carport ? calcCarportPrice() :0)+
        (gutter ? calcGutterPrice() :0)+       
        (transportPrice(wojewodztwo) )

        
        

    setPrice(fullPrice);
}
calculatePrice();

    return (
        <div >            
            <p className='text-4xl max-sm:text-base md:pt-5 text-red-800 font-bold'>Cena:<span className='underline ml-5 font-black'>{price} zł</span></p>
            <p className="md:text-sm text-xs md:pb-2">Proszę pamiętać, że podana cena jest orientacyjna i nie stanowi oferty wiążącej. </p>          
        </div>
    );
}

export default CalcMain;