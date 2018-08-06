import { Injectable } from '@angular/core';
import {Router, CanActivate, Route, ActivatedRouteSnapshot} from '@angular/router';
// import {CommonService} from "../../@shared/services/common.service";

/**
 * @Class CheckAuth
 * @description  to allow api access as per the role
 * @tickets PO-597
 */
@Injectable()
export class CheckAuth implements CanActivate {
  constructor(public router: Router/*,private commonService: CommonService*/) {
  }

  canActivate(route: ActivatedRouteSnapshot) {
    let userData = JSON.parse(localStorage.getItem('userInfo')).tokens;
    if(userData.indexOf(route.data.accessToken)>-1){
      return true;
    } else {
      // this.commonService.showNotification({message: 'You are not authorized to access this.', type: 'error'});
      return false;
    }
  }
}
