const Api = (() => {
    const baseUrl = "http://localhost:4232/courseList";
  
    const getCourses = () => fetch(baseUrl).then((response) => response.json());
  
    return {
      getCourses,
    };
  })();


const View = (() => {
    const domStr = {
        availableClasses: '#availableCourses',
        selectedClasses: '#selectedCourses',
        totalCredits: '#total',
        evenBox: 'evenBox',
        oddBox: 'oddBox',
    }

    const render = (ele, tmp) => {
        ele.innerHTML = tmp;
    }

    const messages = {
        overCreditMessage: "You cannot choose more than 18 credits in one semester!",
        confirmMessage: (totalCredits) => {
            return "You have chosen " + totalCredits + " credits for this semester. You cannot change once you submit. Do you want to confirm?";
        }
    }

    const createTmp = (arr, canClick) => {
        let tmp = ''; 
        let evenOrOdd = 0; 
        let handleClick = '';

        if(canClick ==true) {
            handleClick = 'onclick="Controller.clickClass(this)"';
        }
        
        arr.forEach((course) => {
            let required = '';
            let checkEvenOrOdd = '';
            if(course.required === true)
                required = 'Compulsory';
            else
                required = 'Elective';

            if(evenOrOdd % 2 === 0) 
                checkEvenOrOdd = domStr.evenBox;
            else 
                checkEvenOrOdd = domStr.oddBox;

            tmp += `<div class="${checkEvenOrOdd}" ${handleClick} id="${course.courseId}">
                <span>${course.courseName}</span>
                <span>Course Type: ${required}</span>
                <span>Course Credit: ${course.credit}</span>
            </div>`;
            ++evenOrOdd;
        });
        return tmp;
    }

    const modifyCredits = (num) => {
        return "Total Credit: " + num;
    }

    return {
        domStr,
        messages,
        render,
        createTmp,
        modifyCredits
    };
})(); 


const Model = ((Api, view) => {
    class State {
        #availableList = [];
        #selectedList = [];
        #creditCount = 0;
        #prospectList = []; 

        get availableList() {
            return this.#availableList;
        }
        set availableList(newList) {
            this.#availableList = [...newList];
            const availableClasses = document.querySelector(view.domStr.availableClasses);
            const tmp = view.createTmp(this.#availableList, true);
            view.render(availableClasses, tmp);
        }
        get selectedList() {
            return this.#selectedList;
        }
        set selectedList(newList) {
            this.#selectedList = [...newList];

            const selectedClasses = document.querySelector(view.domStr.selectedClasses);
            const tmp = view.createTmp(this.#selectedList, false);
            view.render(selectedClasses, tmp);
        }
        get creditCount() {
            return this.#creditCount;
        }

        addCredits(id) {
            let course = this.getCourseFromId(id);
            let num = course.credit;

            if(this.#creditCount + num > 18) {
                alert(view.messages.overCreditMessage);
                return false;
            }

            this.#creditCount += num;
            const creditDisplayer = document.querySelector(view.domStr.totalCredits);
            const tmp = view.modifyCredits(this.#creditCount);
            view.render(creditDisplayer, tmp);

            this.#prospectList.push(id);

            return true;
        }
        subtractCredits(id) {
            let course = this.getCourseFromId(id);
            let num = course.credit;

            this.#creditCount -= num;
            const creditDisplayer = document.querySelector(view.domStr.totalCredits);
            const tmp = view.modifyCredits(this.#creditCount);
            view.render(creditDisplayer, tmp);

            for(let i = 0; i < this.#prospectList.length; ++i) {
                if(this.#prospectList[i] === id) {
                    this.#prospectList.splice(i, 1);
                    break;
                }
            }
        }
        getCourseFromId(id) {
            for(let course of this.#availableList) {
                if(course.courseId == id) { 
                    return course;
                }
            }
            return null;
        }
        moveCourses() {
            let newSList = [];
            let newAList = [...this.#availableList];
            for(let id of this.#prospectList) {
                newSList.push(this.getCourseFromId(id));
                this.removeCourse(id, newAList);
            }

            return {
                newSList,
                newAList
            }
        }
        removeCourse(id, array) {
            for(let i = 0; i < array.length; ++i) {
                if(array[i].courseId == id) {
                    array.splice(i, 1);
                    return;
                }
            }

    
        }
    }
    
    const {getCourses} = Api;

    return {
        getCourses,
        State
    }
})(Api, View);


const Controller = ((model, view) => {
    const state = new model.State();

    
    const clickClass = (element) => {
        let isSelected = false;

        if(element.className === 'evenBox') {
            element.className = 'even-box-selected';
            isSelected = true;
        }
        else if(element.className === 'oddBox') {
            element.className = 'odd-box-selected';
            isSelected = true;
        }
        else if(element.className === 'even-box-selected')
            element.className = 'evenBox';
        else if(element.className === 'odd-box-selected')
            element.className = 'oddBox';

        
        if(isSelected === true) {
            if(state.addCredits(element.id) === false) {
                if(element.className === 'even-box-selected')
                    element.className = 'evenBox';
                else if(element.className === 'odd-box-selected')
                    element.className = 'oddBox';
            }
        } else {
            state.subtractCredits(element.id);
        }
    }


    const clickSelect = (element) => {
        let result = confirm(view.messages.confirmMessage(state.creditCount));
        if(result === true) {
            let courseLists = state.moveCourses();
            state.availableList = [...courseLists.newAList];
            state.selectedList = [...courseLists.newSList];
            element.disabled = true;
        }
    }

   
    const init = () => {
        model.getCourses().then((courses) => {
            state.availableList = [...courses];
        });
    }

    const bootstrap = () => {
        init();
    }

    return {
        bootstrap,
        clickClass,
        clickSelect
    }
})(Model, View);

Controller.bootstrap();
