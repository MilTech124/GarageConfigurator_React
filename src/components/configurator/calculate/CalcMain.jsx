import garagePrice from "./garagePrice.js";

function CalcMain({selectedOptions, price, setPrice}) {
    const SoloGaragePrice = garagePrice({selectedOptions});
    const {width,depth,roof,height,automatic,roofType,filc,door,window,carport,carportWidth,gutter,carportType} = selectedOptions;


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
        const typePrice = carportType ==="brak" ? 100 : carportType=== "oblachowane" ?  2000 :carportType=== "azury" ?  3000 : null

        if(carport) {
            resault = (carportWidth-StandardWith)/StandardPaidWith* pricePerMeter +typePrice           
        }
        return resault
    }
    const calcGutterPrice = () => {
        let resault =0 
        const pricePerMeter = 100
        if(roof === "dwuspad" || roof === "dwuspad przod-tył") {
            resault = width*2*pricePerMeter
        }else {
            resault = width*pricePerMeter
        }
        return resault
    }

    

   const calculatePrice = () => {
    const fullPrice =        
        SoloGaragePrice + 
        (roof === "spad tył" ? -500 : 0) +
        (calcHeightPrice())+
        (automatic ? 1300 : 0)+
        (roofType === "blachodachówka" ? (depth*width*65) : 0)+
        (filc ? (depth * width * 25) : 0)+
        (door.length >= 0 ? (door.length*450) : 0)+
        (window.length >= 0 ? (window.length*450) : 0)+
        (carport ? calcCarportPrice() :0)+
        (gutter ? calcGutterPrice() :0)
        
        

    setPrice(fullPrice);
}
calculatePrice();

    return (
        <div >            
            <p className='text-4xl pt-5 text-red-800 font-bold'>Cena:<span className='underline ml-5 font-black'>{price} zł</span></p>
            <p className="text-sm pb-2">Proszę pamiętać, że podana cena jest orientacyjna i nie stanowi oferty wiążącej. </p>
        </div>
    );
}

export default CalcMain;