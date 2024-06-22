import { useEffect, useState } from 'react'
import { Select, InputLabel,FormControl,MenuItem,Slider } from '@mui/material'
import { variable } from '../Variable'


function GateSetting({ selectedOptions, setSelectedOptions}) {
     

    const handleGates = (operator) => {
        if(selectedOptions.gateCount===0 && operator==='+'){
            setSelectedOptions({...selectedOptions, gateCount: selectedOptions.gateCount + 1})
            return
        }        
        if(selectedOptions.gateCount>=1 && operator==='-'){
            setSelectedOptions({...selectedOptions, gateCount: selectedOptions.gateCount - 1})
            return
        }
       
        if (selectedOptions.width >=6 && operator==='+' && selectedOptions.gateCount <=2 && (selectedOptions.width >= selectedOptions.gateWidth2 + selectedOptions.gateWidth1 + selectedOptions.gatePositionValue1/100)) {
            setSelectedOptions({...selectedOptions, gateCount: selectedOptions.gateCount + 1   
                             
            })           
            return
        }
        if (selectedOptions.width >=9 && operator==='+' && selectedOptions.gateCount <=3 
        && (selectedOptions.width >= selectedOptions.gateWidth3 + selectedOptions.gateWidth2 + selectedOptions.gatePositionValue1/100)) {
            setSelectedOptions({...selectedOptions, gateCount: selectedOptions.gateCount + 1})
            return
        }else alert('Nie możesz dodać więcej bram. Brak miejsca, zmień rozmiary bram lub ich pozycje')

    }

    const handleChange = (prop) => (event) => {
        setSelectedOptions({ ...selectedOptions, [prop]: event.target.value });
    }

  
    const maxSlider1 = () => {
        if(selectedOptions.gateCount===1){
            return selectedOptions.width*100 - selectedOptions.gateWidth1*100
        }
        if(selectedOptions.gateCount===2){
            return selectedOptions.width*100 - selectedOptions.gateWidth2*100 - selectedOptions.gateWidth1*100
        }
        if(selectedOptions.gateCount===3){
            return selectedOptions.width*100 - selectedOptions.gateWidth2*100 - selectedOptions.gateWidth1*100-selectedOptions.gateWidth3*100
        }
      
    }

    const maxSlider2 = () => {       
     
        if(selectedOptions.gateCount===2){
            return  ((selectedOptions.width*100)-selectedOptions.gateWidth2*100 ) 
        }
        if(selectedOptions.gateCount===3){
            return ((selectedOptions.width*100)-selectedOptions.gateWidth2*100-selectedOptions.gateWidth3*100 ) 
        }
       
    }
    const maxSlider3 = () => {
        if(selectedOptions.gateCount===3){
            return selectedOptions.width*100 - selectedOptions.gateWidth3*100 
    }
}


useEffect(() => {
    if(selectedOptions.gateCount===2){
        setSelectedOptions({...selectedOptions, gatePositionValue2: selectedOptions.gatePositionValue1 + selectedOptions.gateWidth1*100, })
        

    }
    if(selectedOptions.gateCount===3){
        setSelectedOptions({...selectedOptions, gatePositionValue3: selectedOptions.gatePositionValue2+ selectedOptions.gateWidth2*100})        
    }
   
}, [selectedOptions.gateCount, selectedOptions.gateWidth1, selectedOptions.gateWidth2,selectedOptions.gateWidth3])


 const gateTable1 = () => {
    if(selectedOptions.width < selectedOptions.gateWidth1){
        setSelectedOptions({...selectedOptions, gateWidth1: selectedOptions.width})
    }

    return variable.gateSizes.width.filter((width) => {
       if(width <= selectedOptions.width) return width 
        }
     )
 }
 const gateTable2 = () => {
    const query= selectedOptions.width-((selectedOptions.gatePositionValue1+3)+selectedOptions.gateWidth1)

    
    if(selectedOptions.width <= query){
        setSelectedOptions({...selectedOptions, gateWidth2: selectedOptions.width})
    }
    return variable.gateSizes.width.filter((width) => {
     
       if( 1<=(selectedOptions.width / (selectedOptions.gateWidth1+selectedOptions.gatePositionValue1+width))) return (width) 
        }
     )
}

const gateTabel3 = () => {
    const query= selectedOptions.width-(selectedOptions.gatePositionValue2+selectedOptions.gateWidth2)
    console.log("Query=",query)
    if(selectedOptions.width <= query){
        setSelectedOptions({...selectedOptions, gateWidth3: selectedOptions.width})
    }
    
}





  return (
    <div>
        <h4 className='bg-slate-900 p-2'>Bramy</h4>

        <div className='relative'> 
            <div className='flex justify-around'>
                <img src="./konfigurator/gate.svg"/>
                <div className='  flex flex-col justify-center items-center'>
                    <p className='text-2xl font-bold'>{selectedOptions.gateCount}</p>
                    <div className='flex gap-2'>
                        <button className='bg-slate-900 text-white px-2 py-1 rounded-md' onClick={() => handleGates("-")}>-</button>
                        <button className='bg-slate-900 text-white px-2 py-1 rounded-md' onClick={() => handleGates("+")}>+</button>
                    </div>
                </div>
            </div>
           
            <p className="text-red-400 text-xs pb-5">Aby dodać więćej bram potrzebujesz min 6m szerokośći garażu</p>
       
            {/* //first gate  */}
            {selectedOptions.gateCount >=1 
            ? <div>
                <FormControl fullWidth>
                    <InputLabel>Pierwsza brama</InputLabel>
                    <Select
                    value={selectedOptions.gateType1}
                    label="Pierwsza brama"
                    onChange={handleChange('gateType1')}
                    >
                    {variable.gateTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                    </Select>
                </FormControl>
                <div className='flex pt-3 gap-1'>
                    <FormControl fullWidth>
                        <InputLabel>Wysokość</InputLabel>
                        <Select
                        value={selectedOptions.gateHeight1}
                        label="Wysokość"
                        onChange={handleChange('gateHeight1')}
                        >
                        {variable.gateSizes.height.map((height) => (
                           height < selectedOptions.height ? <MenuItem key={height} value={height}>{height} cm</MenuItem>:null
                        ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Szerokość</InputLabel>
                        <Select
                        disabled={selectedOptions.gateCount===1 ? false : true}
                        value={selectedOptions.gateWidth1}
                        label="Szerokość"
                        onChange={handleChange('gateWidth1')}
                        >
                        {gateTable1().map((width) => (
                            <MenuItem key={width} value={width}>{width} m</MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                </div>

                {/* Slider*/}
                
                <h5 className='text-sm text-center pt-2 text-slate-900'>Pozycja bramy</h5>                
                <Slider
                    aria-label="Default"                    
                    defaultValue={0}
                    valueLabelDisplay="auto"
                    step={10}
                    marks
                    min={0}
                    max={maxSlider1()}
                    onChange={(event, newValue) => setSelectedOptions({...selectedOptions, gatePositionValue1: newValue})}
                />
                {selectedOptions.gatePositionValue1} cm od lewej krawędzi
                
            </div> 
            : null}

            {/* //second gate  */}
            {selectedOptions.gateCount >=2 && (selectedOptions.width >= selectedOptions.gateWidth2 + selectedOptions.gateWidth1 + selectedOptions.gatePositionValue1/100) 
            ? <div className='py-5 relative'>
                <h4 className='bg-slate-600 text-sm p-2 mb-2'>Druga brama</h4>
                {/* //gateCount -1 button to remove gate */}
                <button className='absolute top-0 right-0 bg-slate-900 hover:bg-slate-500 text-white px-3 py-1 rounded-md' onClick={() => handleGates("-")}>-</button>

                <FormControl fullWidth>
                    <InputLabel>Druga brama</InputLabel>
                    <Select
                    value={selectedOptions.gateType2}
                    label="Druga brama"
                    onChange={handleChange('gateType2')}
                    >
                    {variable.gateTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                    </Select>                    
                </FormControl>

                <div className='flex pt-3 gap-1'>
                    <FormControl fullWidth>
                        <InputLabel>Wysokość</InputLabel>
                        <Select                
                        value={selectedOptions.gateHeight2}
                        label="Wysokość"
                        onChange={handleChange('gateHeight2')}
                        >
                        {variable.gateSizes.height.map((height) => (
                            <MenuItem key={height} value={height}>{height} m</MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Szerokość</InputLabel>
                        <Select                        
                        value={selectedOptions.gateWidth2<=selectedOptions.width ? selectedOptions.gateWidth2 : selectedOptions.width}
                        label="Szerokość"
                        onChange={handleChange('gateWidth2')}
                        >
                        {gateTable2().map((width) => (
                            <MenuItem key={width} value={width}>{width} m</MenuItem>
                        ))}
                        </Select>
                    </FormControl>                
                </div>
                    
                     {/* Slider 2*/}
                     <h5 className='text-sm text-center pt-2 text-slate-900'>Pozycja bramy</h5>                
                <Slider
                    aria-label="Default"
                    defaultValue={50}
                    valueLabelDisplay="auto"
                    step={10}
                    marks
                    min={selectedOptions.gateWidth1*100 + selectedOptions.gatePositionValue1}
                    max={maxSlider2()}
                    onChange={(event, newValue) => setSelectedOptions({...selectedOptions, gatePositionValue2: newValue})}
                />
                {selectedOptions.gatePositionValue2} cm od lewej krawędzi
                
            </div>
            : selectedOptions.gateCount >=2 
            ? <p className='text-red-400 text-xs'>Nie możesz dodać drugiej bramy. Brak miejsca</p>
            :null}
                            
           deb= <pre>{  selectedOptions.gateWidth1 + selectedOptions.gatePositionValue1/100 }</pre>

            {/* //third gate  */}
            {selectedOptions.gateCount >=3 && selectedOptions.width >=9 && (selectedOptions.width >= selectedOptions.gateWidth2 +selectedOptions.gateWidth3 + selectedOptions.gatePositionValue2/100  )
            ? <div className='py-5 relative'>
                <h4 className='bg-slate-600 text-sm p-2 mb-2'>Trzecia brama</h4>
                {/* //gateCount -1 button to remove gate */}
                <button className='absolute top-0 right-0 bg-slate-900 hover:bg-slate-500 text-white px-3 py-1 rounded-md' onClick={() => handleGates("-")}>-</button>

                <FormControl fullWidth>
                    <InputLabel>Trzecia brama</InputLabel>
                    <Select
                    value={selectedOptions.gateType3}
                    label="Trzecia brama"
                    onChange={handleChange('gateType3')}
                    >
                    {variable.gateTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                    </Select>
                </FormControl>
                <div className='flex pt-3 gap-1'>
                    <FormControl fullWidth>
                        <InputLabel>Wysokość</InputLabel>
                        <Select
                        value={selectedOptions.gateHeight3}
                        label="Wysokość"
                        onChange={handleChange('gateHeight3')}
                        >
                        {variable.gateSizes.height.map((height) => (
                            <MenuItem key={height} value={height}>{height} m</MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Szerokość</InputLabel>
                        <Select
                        value={selectedOptions.gateWidth3<=selectedOptions.width ? selectedOptions.gateWidth3 : selectedOptions.width}
                        label="Szerokość"
                        onChange={handleChange('gateWidth3')}
                        >
                        {gateTable2().map((width) => (
                            <MenuItem key={width} value={width}>{width} m</MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                    </div>
                        
                     {/* Slider*/}
                <h5 className='text-sm text-center pt-2 text-slate-900'>Pozycja bramy</h5>                
                <Slider
                    aria-label="Default"
                    defaultValue={50}
                    valueLabelDisplay="auto"
                    step={10}
                    marks
                    min={selectedOptions.gateWidth2*100 + selectedOptions.gatePositionValue2 }
                    max={maxSlider3()}
                    onChange={(event, newValue) => setSelectedOptions({...selectedOptions, gatePositionValue3: newValue})}
                />
                {selectedOptions.gatePositionValue3} cm od lewej krawędzi
                
                </div>
            : selectedOptions.gateCount >=3 
            ? <p className='text-red-400 text-xs'>Nie możesz dodać trzeciej bramy. Brak miejsca</p>
            :null}
        </div>

    </div>
  )
}

export default GateSetting